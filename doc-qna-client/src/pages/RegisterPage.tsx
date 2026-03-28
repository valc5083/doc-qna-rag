import { useState } from "react";
import { CircularProgress, Link } from "@mui/material";
import { PersonAddOutlined } from "@mui/icons-material";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { authApi } from "../api/authApi";
import { useAuthStore } from "../store/authStore";
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
import ConfirmationDialog from "../components/ConfirmationDialog";

const RegisterPage = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password || !confirm) {
      setError("Please fill in all fields.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const response = await authApi.register({ email, password });
      login(response.accessToken, response.refreshToken, response.email);
      navigate("/dashboard");
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Registration failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper>
      <AuthCard>
        <CardInner>
          <HeaderSection>
            <IconAvatar>
              <PersonAddOutlined sx={{ color: "white" }} />
            </IconAvatar>
            <PageTitle>Create Account</PageTitle>
            <SubTitle>Join DocQnA today</SubTitle>
          </HeaderSection>

          <StyledTextField
            fullWidth
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <StyledTextField
            fullWidth
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <LastTextField
            fullWidth
            label="Confirm Password"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleRegister()}
          />

          <SubmitButton onClick={handleRegister} disabled={loading}>
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Create Account"
            )}
          </SubmitButton>

          <BottomLinkRow>
            <BottomLinkText>
              Already have an account?{" "}
              <Link
                component={RouterLink}
                to="/login"
                fontWeight={600}
                color="#1F4E79"
                underline="hover"
              >
                Sign in
              </Link>
            </BottomLinkText>
          </BottomLinkRow>
        </CardInner>
      </AuthCard>

      <ConfirmationDialog
        open={!!error}
        type="error"
        title="Registration Error"
        message={error}
        onClose={() => setError("")}
      />
    </PageWrapper>
  );
};

export default RegisterPage;
