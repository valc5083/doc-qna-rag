using DocQnA.API.DTOs;
using DocQnA.API.Models;
using DocQnA.API.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace DocQnA.API.Services
{
    public class AuthService
    {
        private readonly AppDbContext _db;
        private readonly TokenService _tokenService;

        public AuthService(AppDbContext db, TokenService tokenService)
        {
            _db = db;
            _tokenService = tokenService;
        }

        public async Task<AuthResponse> RegisterAsync(RegisterRequests request)
        {
            //check if email already exists
            var exists = await _db.Users.AnyAsync(u => u.Email == request.Email.ToLower());

            if (exists)
                throw new InvalidOperationException("Email already registered");

            //create user with hashed password
            var user = new User
            {
                Email = request.Email.ToLower(),
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password)
            };

            //Generate tokens
            var refreshToken = _tokenService.GenerateRefreshToken();
            user.RefreshToken = refreshToken;
            user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);

            _db.Users.Add(user);
            await _db.SaveChangesAsync();

            return new AuthResponse
            {
                AccessToken = _tokenService.GenerateAccessToken(user),
                RefreshToken = refreshToken,
                Email = user.Email,
                ExpiresAt = DateTime.UtcNow.AddMinutes(60)
            };
        }

        public async Task<AuthResponse> LoginAsync(LoginRequests request)
        {
            // Find user by email
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == request.Email.ToLower());

            if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
                throw new InvalidOperationException("Invalid email or password");

            // Rotate refresh token on every login
            var refreshToken = _tokenService.GenerateRefreshToken();
            user.RefreshToken = refreshToken;
            user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);
            await _db.SaveChangesAsync();

            return new AuthResponse
            {
                AccessToken = _tokenService.GenerateAccessToken(user),
                RefreshToken = refreshToken,
                Email = user.Email,
                ExpiresAt = DateTime.UtcNow.AddMinutes(60)
            };
        }

        public async Task<AuthResponse> RefreshTokenAsync(string refreshToken)
        {
            var user = await _db.Users.FirstOrDefaultAsync(u => u.RefreshToken == refreshToken);

            if (user == null || user.RefreshTokenExpiry < DateTime.UtcNow)
                throw new InvalidOperationException("Invalid refresh token");

            //Rotate refresh token on every use
            var newRefreshToken = _tokenService.GenerateRefreshToken();
            user.RefreshToken = newRefreshToken;
            user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);
            await _db.SaveChangesAsync();

            return new AuthResponse
            {
                AccessToken = _tokenService.GenerateAccessToken(user),
                RefreshToken = newRefreshToken,
                Email = user.Email,
                ExpiresAt = DateTime.UtcNow.AddMinutes(60)
            };
        }

        public async Task LogoutAsync(string refreshToken)
        {
            var user = await _db.Users.FirstOrDefaultAsync(u => u.RefreshToken == refreshToken);

            if (user != null)
            {
                user.RefreshToken = null;
                user.RefreshTokenExpiry = null;
                await _db.SaveChangesAsync();
            }
        }
    }
}
