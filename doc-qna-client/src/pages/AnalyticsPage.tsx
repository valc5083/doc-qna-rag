import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  CircularProgress,
  IconButton,
  Typography,
  LinearProgress,
} from "@mui/material";
import { ArrowBack, TrendingUp } from "@mui/icons-material";
import { qnaApi } from "../api/qnaApi";
import { useAuthStore } from "../store/authStore";
import type { UserAnalytics } from "../types";
import {
  NavBar,
  NavTitle,
  NavEmail,
  NavLogoutButton,
  MainContent,
} from "../components/styles/DocumentStyles";
import {
  StatsRow,
  StatCard,
  StatNumber,
  StatLabel,
} from "../components/styles/HistoryStyles";
import { HistoryLayout } from "../components/styles/HistoryStyles";
import usePageTitle from "../hooks/usePageTitle";
import toast from "react-hot-toast";
import { authApi } from "../api/authApi";
import DarkModeToggle from "../components/DarkModeToggle";
import { styled } from "@mui/material/styles";

const BackIconButton = styled(IconButton)({
  color: "#ffffff",
});

const TrendingTitleIcon = styled(TrendingUp)({
  fontSize: 20,
  marginRight: 6,
  verticalAlign: "middle",
});

const BorderedStatCard = styled(StatCard)(({ theme }) => ({
  border:
    theme.palette.mode === "dark"
      ? "none"
      : `1px solid ${theme.palette.divider}`,
}));

const AnalyticsPanel = styled(Box)(({ theme }) => ({
  background: theme.palette.background.paper,
  borderRadius: "12px",
  padding: 24,
  marginBottom: 24,
  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  border:
    theme.palette.mode === "dark"
      ? "none"
      : `1px solid ${theme.palette.divider}`,
}));

const DocumentLinearProgress = styled(LinearProgress)({
  height: 8,
  borderRadius: "4px",
  backgroundColor: "#E3F2FD",
  "& .MuiLinearProgress-bar": {
    backgroundColor: "#2E75B6",
  },
});

const FallbackLinearProgress = styled(LinearProgress)({
  height: 8,
  borderRadius: "4px",
  backgroundColor: "#FFF3E0",
  "& .MuiLinearProgress-bar": {
    backgroundColor: "#FF9800",
  },
});

const ActivityBar = styled(Box, {
  shouldForwardProp: (prop) => prop !== "barHeight",
})<{ barHeight: number }>(({ barHeight }) => ({
  width: 20,
  height: Math.max(4, barHeight),
  background: "linear-gradient(180deg, #2E75B6, #1F4E79)",
  borderRadius: "3px 3px 0 0",
  transition: "height 0.3s",
  cursor: "default",
  "&:hover": {
    opacity: 0.8,
  },
}));

const VerticalDateLabel = styled(Typography)({
  writingMode: "vertical-rl",
});

const TopDocumentName = styled(Typography)({
  maxWidth: "70%",
});

const RankedDocLinearProgress = styled(LinearProgress)({
  height: 6,
  borderRadius: "3px",
  backgroundColor: "#EBF3FB",
  "& .MuiLinearProgress-bar": {
    background: "linear-gradient(90deg, #1F4E79, #2E75B6)",
  },
});

const formatBytes = (bytes: number) => {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const AnalyticsPage = () => {
  const navigate = useNavigate();
  const { email, logout } = useAuthStore();
  usePageTitle("Analytics");

  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    qnaApi
      .getAnalytics()
      .then(setAnalytics)
      .catch(() => toast.error("Failed to load analytics."))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem("refreshToken") || "";
    await authApi.logout(refreshToken);
    logout();
    navigate("/login");
  };

  const maxDaily = analytics
    ? Math.max(...analytics.dailyActivity.map((d) => d.questions), 1)
    : 1;

  return (
    <HistoryLayout>
      <NavBar>
        <Box display="flex" alignItems="center" gap={2}>
          <BackIconButton onClick={() => navigate(-1)}>
            <ArrowBack />
          </BackIconButton>
          <NavTitle>
            <TrendingTitleIcon />
            My Analytics
          </NavTitle>
        </Box>
        <Box display="flex" alignItems="center" gap={2}>
          <NavEmail>{email}</NavEmail>
          <DarkModeToggle />
          <NavLogoutButton variant="outlined" onClick={handleLogout}>
            Logout
          </NavLogoutButton>
        </Box>
      </NavBar>

      <MainContent>
        {loading ? (
          <Box textAlign="center" py={8}>
            <CircularProgress />
          </Box>
        ) : analytics ? (
          <>
            {/* Stats */}
            <StatsRow>
              <BorderedStatCard>
                <StatNumber>{analytics.totalQuestions}</StatNumber>
                <StatLabel>Total Questions</StatLabel>
              </BorderedStatCard>
              <BorderedStatCard>
                <StatNumber>{analytics.questionsThisMonth}</StatNumber>
                <StatLabel>This Month</StatLabel>
              </BorderedStatCard>
              <BorderedStatCard>
                <StatNumber>{analytics.questionsThisWeek}</StatNumber>
                <StatLabel>This Week</StatLabel>
              </BorderedStatCard>
              <BorderedStatCard>
                <StatNumber>{analytics.readyDocuments}</StatNumber>
                <StatLabel>Ready Documents</StatLabel>
              </BorderedStatCard>
              <BorderedStatCard>
                <StatNumber>
                  {formatBytes(analytics.totalStorageBytes)}
                </StatNumber>
                <StatLabel>Storage Used</StatLabel>
              </BorderedStatCard>
            </StatsRow>

            {/* Answer Source Breakdown */}
            <AnalyticsPanel>
              <Typography
                fontWeight={700}
                fontSize="1rem"
                color="text.primary"
                mb={2}
              >
                🎯 Answer Source Breakdown
              </Typography>
              <Box display="flex" gap={2} flexWrap="wrap">
                <Box flex={1}>
                  <Typography fontSize="0.8rem" color="text.secondary" mb={0.5}>
                    Document-based answers
                  </Typography>
                  <DocumentLinearProgress
                    variant="determinate"
                    value={
                      analytics.totalQuestions > 0
                        ? (analytics.documentAnswers /
                            analytics.totalQuestions) *
                          100
                        : 0
                    }
                  />
                  <Typography fontSize="0.75rem" color="#2E75B6" mt={0.5}>
                    {analytics.documentAnswers} answers
                  </Typography>
                </Box>
                <Box flex={1}>
                  <Typography fontSize="0.8rem" color="text.secondary" mb={0.5}>
                    AI fallback answers
                  </Typography>
                  <FallbackLinearProgress
                    variant="determinate"
                    value={
                      analytics.totalQuestions > 0
                        ? (analytics.aiFallbackAnswers /
                            analytics.totalQuestions) *
                          100
                        : 0
                    }
                  />
                  <Typography fontSize="0.75rem" color="#FF9800" mt={0.5}>
                    {analytics.aiFallbackAnswers} answers
                  </Typography>
                </Box>
              </Box>
            </AnalyticsPanel>

            {/* Daily Activity Chart */}
            {analytics.dailyActivity.length > 0 && (
              <AnalyticsPanel>
                <Typography
                  fontWeight={700}
                  fontSize="1rem"
                  color="text.primary"
                  mb={2}
                >
                  📅 Daily Activity (Last 30 Days)
                </Typography>
                <Box
                  display="flex"
                  alignItems="flex-end"
                  gap={1}
                  height={100}
                  flexWrap="wrap"
                >
                  {analytics.dailyActivity.map((day, i) => (
                    <Box
                      key={i}
                      display="flex"
                      flexDirection="column"
                      alignItems="center"
                      gap={0.5}
                    >
                      <ActivityBar
                        barHeight={(day.questions / maxDaily) * 80}
                        title={`${day.date}: ${day.questions} questions`}
                      />
                      <VerticalDateLabel
                        fontSize="0.55rem"
                        color="text.secondary"
                      >
                        {day.date}
                      </VerticalDateLabel>
                    </Box>
                  ))}
                </Box>
              </AnalyticsPanel>
            )}

            {/* Top Documents */}
            {analytics.topDocuments.length > 0 && (
              <AnalyticsPanel>
                <Typography
                  fontWeight={700}
                  fontSize="1rem"
                  color="text.primary"
                  mb={2}
                >
                  🏆 Most Queried Documents
                </Typography>
                {analytics.topDocuments.map((doc, i) => (
                  <Box key={i} mb={1.5}>
                    <Box display="flex" justifyContent="space-between" mb={0.5}>
                      <TopDocumentName
                        fontSize="0.875rem"
                        fontWeight={600}
                        color="text.primary"
                        noWrap
                      >
                        {i + 1}. {doc.documentName}
                      </TopDocumentName>
                      <Typography
                        fontSize="0.8rem"
                        color="#2E75B6"
                        fontWeight={600}
                      >
                        {doc.questionCount} questions
                      </Typography>
                    </Box>
                    <RankedDocLinearProgress
                      variant="determinate"
                      value={
                        (doc.questionCount /
                          analytics.topDocuments[0].questionCount) *
                        100
                      }
                    />
                  </Box>
                ))}
              </AnalyticsPanel>
            )}
          </>
        ) : (
          <Typography color="text.secondary" textAlign="center">
            No analytics data yet. Start asking questions!
          </Typography>
        )}
      </MainContent>
    </HistoryLayout>
  );
};

export default AnalyticsPage;
