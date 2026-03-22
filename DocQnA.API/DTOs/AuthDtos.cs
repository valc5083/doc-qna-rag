namespace DocQnA.API.DTOs
{
    public class RegisterRequests    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class  LoginRequests
    {
        public string   Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class AuthResponse
    {
        public string AccessToken { get; set; } = string.Empty;
        public string RefreshToken { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; }

    }
}
