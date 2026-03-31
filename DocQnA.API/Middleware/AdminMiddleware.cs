using System.Security.Claims;

namespace DocQnA.API.Middleware;

public static class AdminAuthorizationExtensions
{
    public static bool IsAdmin(
        this ClaimsPrincipal user,
        IConfiguration config)
    {
        var email = user.FindFirst(ClaimTypes.Email)?.Value;
        var adminEmail = config["Admin:Email"];

        return !string.IsNullOrEmpty(email) &&
               !string.IsNullOrEmpty(adminEmail) &&
               email.Equals(adminEmail,
                   StringComparison.OrdinalIgnoreCase);
    }
}