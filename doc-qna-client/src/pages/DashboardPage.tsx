import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { authApi } from "../api/authApi";
import {
  DashboardWrapper,
  WelcomeCard,
  CardBody,
  WelcomeTitle,
  SignedInLabel,
  EmailDisplay,
  ComingSoonBanner,
  ComingSoonText,
  LogoutButton,
} from "../components/styles/DashboardStyles";

const DashboardPage = () => {
  const navigate = useNavigate();
  const { email, logout } = useAuthStore();

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem("refreshToken") || "";
    await authApi.logout(refreshToken);
    logout();
    navigate("/login");
  };

  return (
    <DashboardWrapper>
      <WelcomeCard>
        <CardBody>
          <WelcomeTitle>🎉 Welcome to DocQnA!</WelcomeTitle>

          <SignedInLabel>Signed in as</SignedInLabel>
          <EmailDisplay>{email}</EmailDisplay>

          <ComingSoonBanner>
            <ComingSoonText>
              📄 Document upload, AI-powered Q&A, and chat history are coming in
              the next sprint. Stay tuned!
            </ComingSoonText>
          </ComingSoonBanner>

          <LogoutButton variant="outlined" onClick={handleLogout}>
            Logout
          </LogoutButton>
        </CardBody>
      </WelcomeCard>
    </DashboardWrapper>
  );
};

export default DashboardPage;
