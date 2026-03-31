import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Box,
  CircularProgress,
  Collapse,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  History,
  PictureAsPdf,
  QuestionAnswer,
  ExpandMore,
  ExpandLess,
  Delete,
  ArrowBack,
  Chat,
} from "@mui/icons-material";
import ReactMarkdown from "react-markdown";
import { qnaApi } from "../api/qnaApi";
import type { ChatHistoryItem } from "../types";
import {
  NavBar,
  NavTitle,
  NavEmail,
  NavLogoutButton,
  NavActions,
  MainContent,
} from "../components/styles/DocumentStyles";
import { useAuthStore } from "../store/authStore";
import { authApi } from "../api/authApi";
import {
  HistoryLayout,
  HistoryCard,
  HistoryCardHeader,
  HistoryCardBody,
  QuestionText,
  AnswerText,
  MetaRow,
  MetaText,
  DocBadge,
  ClearButton,
  EmptyHistoryBox,
  StatsRow,
  StatCard,
  StatNumber,
  StatLabel,
} from "../components/styles/HistoryStyles";
import ConfirmationDialog from "../components/ConfirmationDialog";
import { HistoryListSkeleton } from "../components/skeletons/HistorySkeletons";
import usePageTitle from "../hooks/usePageTitle";

const HistoryPage = () => {
  const navigate = useNavigate();
  usePageTitle("Chat History");

  const { email, logout } = useAuthStore();
  const [history, setHistory] = useState<ChatHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const data = await qnaApi.getHistory(50);
      setHistory(data);
    } catch (err) {
      toast.error("Failed to load history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleClear = () => {
    setShowClearConfirm(true);
  };

  const confirmClear = async () => {
    try {
      setClearing(true);
      await qnaApi.clearHistory();
      setHistory([]);
      toast.success("Chat history cleared successfully.");
    } catch {
      toast.error("Failed to clear history.");
    } finally {
      setClearing(false);
      setShowClearConfirm(false);
    }
  };

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem("refreshToken") || "";
    await authApi.logout(refreshToken);
    logout();
    navigate("/login");
  };

  const handleDeleteOne = async (id: string) => {
    try {
      setDeletingId(id);
      await qnaApi.deleteOne(id);
      setHistory((prev) => prev.filter((h) => h.id !== id));
      toast.success("Conversation deleted.");
    } catch {
      toast.error("Failed to delete.");
    } finally {
      setDeletingId(null);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // ── Stats ──────────────────────────────────────────────────
  const totalQuestions = history.length;
  const uniqueDocs = new Set(history.map((h) => h.documentId).filter(Boolean))
    .size;
  const avgSources =
    history.length > 0
      ? (
          history.reduce((sum, h) => sum + (h.sources?.length ?? 0), 0) /
          history.length
        ).toFixed(1)
      : "0";

  return (
    <HistoryLayout>
      {/* Nav Bar */}
      <NavBar>
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton onClick={() => navigate(-1)} sx={{ color: "#ffffff" }}>
            <ArrowBack />
          </IconButton>
          <NavTitle>📜 Chat History</NavTitle>
        </Box>
        <NavActions>
          <NavEmail>{email}</NavEmail>
          <NavLogoutButton variant="outlined" size="small" onClick={handleLogout}>
            Logout
          </NavLogoutButton>
        </NavActions>
      </NavBar>

      <MainContent>
        {/* Stats Row */}
        {!loading && history.length > 0 && (
          <StatsRow>
            <StatCard>
              <StatNumber>{totalQuestions}</StatNumber>
              <StatLabel>Total Questions</StatLabel>
            </StatCard>
            <StatCard>
              <StatNumber>{uniqueDocs}</StatNumber>
              <StatLabel>Documents Queried</StatLabel>
            </StatCard>
            <StatCard>
              <StatNumber>{avgSources}</StatNumber>
              <StatLabel>Avg Sources/Answer</StatLabel>
            </StatCard>
          </StatsRow>
        )}

        {/* Header Row */}
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          mb={3}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <History sx={{ color: "#1F4E79" }} />
            <Typography fontWeight={700} fontSize="1.2rem" color="#1F4E79">
              Your Conversations
            </Typography>
          </Box>
          {history.length > 0 && (
            <ClearButton
              variant="outlined"
              onClick={handleClear}
              disabled={clearing}
              startIcon={clearing ? <CircularProgress size={14} /> : <Delete />}
            >
              Clear All
            </ClearButton>
          )}
        </Box>

        {/* Loading */}
        {loading ? (
          <HistoryListSkeleton />
        ) : history.length === 0 ? (
          <EmptyHistoryBox>
            <QuestionAnswer sx={{ fontSize: 64, mb: 2, opacity: 0.2 }} />
            <Typography fontSize="1.1rem" mb={1}>
              No conversations yet
            </Typography>
            <Typography fontSize="0.875rem" mb={3}>
              Upload a PDF and start asking questions!
            </Typography>
            <ClearButton
              variant="outlined"
              onClick={() => navigate("/dashboard")}
              sx={{ color: "#2E75B6", borderColor: "#2E75B6" }}
            >
              Go to Dashboard
            </ClearButton>
          </EmptyHistoryBox>
        ) : (
          history.map((item) => (
            <HistoryCard key={item.id}>
              {/* Card Header */}
              <HistoryCardHeader>
                <Box display="flex" alignItems="center" gap={1} flex={1}>
                  {item.documentName && (
                    <DocBadge>
                      <PictureAsPdf sx={{ fontSize: 12 }} />
                      {item.documentName.length > 30
                        ? item.documentName.substring(0, 30) + "..."
                        : item.documentName}
                    </DocBadge>
                  )}
                  <MetaText>
                    {new Date(item.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </MetaText>
                </Box>

                <Box display="flex" alignItems="center" gap={1}>
                  {/* Chat again button */}
                  {item.documentId && (
                    <Tooltip title="Continue chatting">
                      <IconButton
                        size="small"
                        onClick={() =>
                          navigate(`/chat/${item.documentId}`, {
                            state: {
                              mode: "history",
                              selectedHistoryId: item.id,
                              scrollToBottom: true,
                            },
                          })
                        }
                        sx={{ color: "#2E75B6" }}
                      >
                        <Chat fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}

                  <Tooltip title="Delete this conversation">
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteOne(item.id)}
                      disabled={deletingId === item.id}
                      sx={{ color: "#e53935" }}
                    >
                      {deletingId === item.id ? (
                        <CircularProgress size={14} />
                      ) : (
                        <Delete fontSize="small" />
                      )}
                    </IconButton>
                  </Tooltip>

                  {/* Expand toggle */}
                  <Tooltip
                    title={
                      expandedId === item.id ? "Collapse" : "Show full answer"
                    }
                  >
                    <IconButton
                      size="small"
                      onClick={() => toggleExpand(item.id)}
                    >
                      {expandedId === item.id ? (
                        <ExpandLess fontSize="small" />
                      ) : (
                        <ExpandMore fontSize="small" />
                      )}
                    </IconButton>
                  </Tooltip>
                </Box>
              </HistoryCardHeader>

              {/* Card Body */}
              <HistoryCardBody>
                {/* Question */}
                <QuestionText>
                  <span style={{ fontSize: "1.1rem" }}>🙋</span>
                  {item.question}
                </QuestionText>

                {/* Answer preview or full */}
                <Collapse in={expandedId === item.id} collapsedSize={72}>
                  <AnswerText
                    sx={{
                      maxHeight: expandedId === item.id ? "none" : 72,
                      overflow: expandedId === item.id ? "visible" : "hidden",
                    }}
                  >
                    <Box
                      sx={{
                        "& p": { margin: 0 },
                        "& p + p": { marginTop: 1 },
                      }}
                    >
                      <ReactMarkdown>{item.answer}</ReactMarkdown>
                    </Box>
                  </AnswerText>
                </Collapse>

                {/* Meta info */}
                <MetaRow sx={{ mt: 1.5 }}>
                  {item.sources && item.sources.length > 0 && (
                    <MetaText>
                      📎 {item.sources.length} source
                      {item.sources.length > 1 ? "s" : ""} used
                    </MetaText>
                  )}
                  <MetaText>💬 {item.answer.split(" ").length} words</MetaText>
                </MetaRow>
              </HistoryCardBody>
            </HistoryCard>
          ))
        )}
      </MainContent>

      <ConfirmationDialog
        open={showClearConfirm}
        type="confirm"
        title="Clear Chat History"
        message={`Are you sure you want to clear all chat history?\n\nNote: This action cannot be undone.`}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={confirmClear}
        confirmText="Clear"
        closeText="Cancel"
      />
    </HistoryLayout>
  );
};

export default HistoryPage;
