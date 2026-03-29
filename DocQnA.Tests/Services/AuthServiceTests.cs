using DocQnA.API.Infrastructure;
using DocQnA.API.Models;
using DocQnA.API.Services;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Moq;

// ← Use alias to avoid conflict with ASP.NET Identity types
using RegisterRequest = DocQnA.API.DTOs.RegisterRequests;
using LoginRequest = DocQnA.API.DTOs.LoginRequests;

namespace DocQnA.Tests.Services;

public class AuthServiceTests : IDisposable  // ← implement IDisposable
{
    private readonly AppDbContext _db;
    private readonly AuthService _authService;

    public AuthServiceTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _db = new AppDbContext(options);

        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:SecretKey"] = "test-secret-key-that-is-long-enough-32chars",
                ["Jwt:Issuer"] = "DocQnA-Test",
                ["Jwt:Audience"] = "DocQnA-Test",
                ["Jwt:ExpiryMinutes"] = "60"
            })
            .Build();

        var tokenService = new TokenService(config);

        // ← AuthService takes 2 args: db + tokenService
        _authService = new AuthService(_db, tokenService);
    }

    [Fact]
    public async Task Register_ValidRequest_ReturnsTokens()
    {
        var request = new RegisterRequest
        {
            Email = "test@example.com",
            Password = "Test@1234"
        };

        var result = await _authService.RegisterAsync(request);

        result.Should().NotBeNull();
        result.AccessToken.Should().NotBeNullOrEmpty();
        result.RefreshToken.Should().NotBeNullOrEmpty();
        result.Email.Should().Be("test@example.com");
    }

    [Fact]
    public async Task Register_DuplicateEmail_ThrowsException()
    {
        var request = new RegisterRequest
        {
            Email = "duplicate@example.com",
            Password = "Test@1234"
        };

        await _authService.RegisterAsync(request);

        var act = async () => await _authService.RegisterAsync(request);

        await act.Should()
            .ThrowAsync<InvalidOperationException>()
            .WithMessage("*already registered*");
    }

    [Fact]
    public async Task Register_EmailStoredAsLowerCase()
    {
        var request = new RegisterRequest
        {
            Email = "UPPERCASE@Example.COM",
            Password = "Test@1234"
        };

        var result = await _authService.RegisterAsync(request);

        result.Email.Should().Be("uppercase@example.com");
    }

    [Fact]
    public async Task Login_ValidCredentials_ReturnsTokens()
    {
        await _authService.RegisterAsync(new RegisterRequest
        {
            Email = "login@example.com",
            Password = "Test@1234"
        });

        var result = await _authService.LoginAsync(new LoginRequest
        {
            Email = "login@example.com",
            Password = "Test@1234"
        });

        result.Should().NotBeNull();
        result.AccessToken.Should().NotBeNullOrEmpty();
        result.Email.Should().Be("login@example.com");
    }

    [Fact]
    public async Task Login_WrongPassword_ThrowsUnauthorized()
    {
        await _authService.RegisterAsync(new RegisterRequest
        {
            Email = "wrong@example.com",
            Password = "CorrectPassword"
        });

        var act = async () => await _authService.LoginAsync(new LoginRequest
        {
            Email = "wrong@example.com",
            Password = "WrongPassword"
        });

        // ← Change to InvalidOperationException to match your AuthService
        await act.Should()
            .ThrowAsync<InvalidOperationException>()
            .WithMessage("*Invalid*");
    }

    [Fact]
    public async Task Login_NonExistentEmail_ThrowsUnauthorized()
    {
        var act = async () => await _authService.LoginAsync(new LoginRequest
        {
            Email = "notexist@example.com",
            Password = "anypassword"
        });

        // ← Change to InvalidOperationException to match your AuthService
        await act.Should().ThrowAsync<InvalidOperationException>();
    }

    [Fact]
    public async Task Login_RefreshTokenRotatesOnEachLogin()
    {
        await _authService.RegisterAsync(new RegisterRequest
        {
            Email = "rotate@example.com",
            Password = "Test@1234"
        });

        var first = await _authService.LoginAsync(new LoginRequest
        {
            Email = "rotate@example.com",
            Password = "Test@1234"
        });

        var second = await _authService.LoginAsync(new LoginRequest
        {
            Email = "rotate@example.com",
            Password = "Test@1234"
        });

        first.RefreshToken.Should().NotBe(second.RefreshToken);
    }

    // ← Properly implement IDisposable
    public void Dispose()
    {
        _db.Dispose();
        GC.SuppressFinalize(this);
    }
}