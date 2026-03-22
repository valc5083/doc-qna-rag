import { useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { Alert, CircularProgress, Link } from "@mui/material";
import {
  PageWrapper,
  AuthCard,
  CardInner,
  IconAvatar,
  HeaderSection,
  PageTitle,
  SubTitle,
  StyledTextField,
  LastTextField,
  SubmitButton,
  BottomLinkRow,
  BottomLinkText,
} from "../components/styles/AuthStyles";
import { LockOutlined } from "@mui/icons-material";
import { authApi } from "../api/authApi";
import { useAuthStore } from "../store/authStore";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const response = await authApi.login({ email, password });
      console.log("Calling login with:", {
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        email: response.email,
      });
      login(response.accessToken, response.refreshToken, response.email);
      navigate("/dashboard");
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Login failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <PageWrapper>
      <AuthCard>
        <CardInner>
          <HeaderSection>
            <IconAvatar>
              <LockOutlined sx={{ color: "white" }} />
            </IconAvatar>
            <PageTitle>Welcome Back</PageTitle>
            <SubTitle>Sign in to DocQnA</SubTitle>
          </HeaderSection>

          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <StyledTextField
            fullWidth
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
          />

          <LastTextField
            fullWidth
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
          />

          <SubmitButton onClick={handleLogin} disabled={loading}>
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Sign In"
            )}
          </SubmitButton>

          <BottomLinkRow>
            <BottomLinkText>
              Don't have an account?{" "}
              <Link
                component={RouterLink}
                to="/register"
                fontWeight={600}
                color="#1F4E79"
                underline="hover"
              >
                Register here
              </Link>
            </BottomLinkText>
          </BottomLinkRow>
        </CardInner>
      </AuthCard>
    </PageWrapper>
  );
};

export default LoginPage;
