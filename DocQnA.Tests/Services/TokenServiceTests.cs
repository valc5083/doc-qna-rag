using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using DocQnA.API.Models;
using DocQnA.API.Services;
using FluentAssertions;
using Microsoft.Extensions.Configuration;

namespace DocQnA.Tests.Services;

public class TokenServiceTests
{
    private readonly TokenService _tokenService;
    private readonly IConfiguration _config;

    public TokenServiceTests()
    {
        _config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:SecretKey"] = "test-secret-key-long-enough-for-hmac-256",
                ["Jwt:Issuer"] = "DocQnA-Test",
                ["Jwt:Audience"] = "DocQnA-Test",
                ["Jwt:ExpiryMinutes"] = "60"
            })
            .Build();

        _tokenService = new TokenService(_config);
    }

    [Fact]
    public void GenerateAccessToken_ReturnsValidJwt()
    {
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "test@example.com"
        };

        var token = _tokenService.GenerateAccessToken(user);

        token.Should().NotBeNullOrEmpty();

        var handler = new JwtSecurityTokenHandler();
        handler.CanReadToken(token).Should().BeTrue();
    }

    [Fact]
    public void GenerateAccessToken_ContainsCorrectClaims()
    {
        var userId = Guid.NewGuid();
        var user = new User
        {
            Id = userId,
            Email = "claims@example.com"
        };

        var token = _tokenService.GenerateAccessToken(user);
        var handler = new JwtSecurityTokenHandler();
        var jwt = handler.ReadJwtToken(token);

        jwt.Claims.Should().Contain(c =>
            c.Type == ClaimTypes.NameIdentifier &&
            c.Value == userId.ToString());

        jwt.Claims.Should().Contain(c =>
            c.Type == ClaimTypes.Email &&
            c.Value == "claims@example.com");
    }

    [Fact]
    public void GenerateAccessToken_HasCorrectIssuerAndAudience()
    {
        var user = new User { Id = Guid.NewGuid(), Email = "test@test.com" };
        var token = _tokenService.GenerateAccessToken(user);
        var handler = new JwtSecurityTokenHandler();
        var jwt = handler.ReadJwtToken(token);

        jwt.Issuer.Should().Be("DocQnA-Test");
        jwt.Audiences.Should().Contain("DocQnA-Test");
    }

    [Fact]
    public void GenerateRefreshToken_ReturnsNonEmptyString()
    {
        var token = _tokenService.GenerateRefreshToken();
        token.Should().NotBeNullOrEmpty();
        token.Length.Should().BeGreaterThan(20);
    }

    [Fact]
    public void GenerateRefreshToken_EachCallReturnsUniqueToken()
    {
        var token1 = _tokenService.GenerateRefreshToken();
        var token2 = _tokenService.GenerateRefreshToken();
        token1.Should().NotBe(token2);
    }
}