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
  Warning,
  CheckCircle,
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";
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
  AnswerTextDocument,
  AnswerTextAI,
  MetaRow,
  MetaText,
  DocBadge,
  ClearButton,
  EmptyHistoryBox,
  StatsRow,
  StatCard,
  StatNumber,
  StatLabel,
  DocumentSourceBadge,
  AISourceBadge,
} from "../components/styles/HistoryStyles";
import ConfirmationDialog from "../components/ConfirmationDialog";
import { HistoryListSkeleton } from "../components/skeletons/HistorySkeletons";
import usePageTitle from "../hooks/usePageTitle";
import DarkModeToggle from "../components/DarkModeToggle";

const BackIconButton = styled(IconButton)({
  color: "#ffffff",
});

const HistoryTitleIcon = styled(History)({
  color: "#1F4E79",
});

const EmptyQuestionIcon = styled(QuestionAnswer)({
  fontSize: 64,
  marginBottom: 16,
  opacity: 0.2,
});

const DashboardButton = styled(ClearButton)({
  color: "#2E75B6",
  borderColor: "#2E75B6",
});

const DocPdfIcon = styled(PictureAsPdf)({
  fontSize: 12,
});

const ChatAgainButton = styled(IconButton)({
  color: "#2E75B6",
});

const DeleteConversationButton = styled(IconButton)({
  color: "#e53935",
});

const AnswerSourceRow = styled(Box)({
  display: "flex",
  gap: 8,
  marginBottom: 8,
  marginTop: 8,
});

const AnswerWarningIcon = styled(Warning)({
  fontSize: 12,
});

const AnswerCheckIcon = styled(CheckCircle)({
  fontSize: 12,
});

const CollapsibleAnswerAI = styled(AnswerTextAI, {
  shouldForwardProp: (prop) => prop !== "isExpanded",
})<{ isExpanded: boolean }>(({ isExpanded }) => ({
  maxHeight: isExpanded ? "none" : 72,
  overflow: isExpanded ? "visible" : "hidden",
}));

const CollapsibleAnswerDocument = styled(AnswerTextDocument, {
  shouldForwardProp: (prop) => prop !== "isExpanded",
})<{ isExpanded: boolean }>(({ isExpanded }) => ({
  maxHeight: isExpanded ? "none" : 72,
  overflow: isExpanded ? "visible" : "hidden",
}));

const MarkdownAnswer = styled(Box)({
  "& p": { margin: 0 },
  "& p + p": { marginTop: 8 },
});

const AnswerMetaRow = styled(MetaRow)({
  marginTop: 12,
});

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
    } catch {
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
      <NavBar>
        <Box display="flex" alignItems="center" gap={2}>
          <BackIconButton onClick={() => navigate(-1)}>
            <ArrowBack />
          </BackIconButton>
          <NavTitle>📜 Chat History</NavTitle>
        </Box>
        <NavActions>
          <NavEmail>{email}</NavEmail>
          <DarkModeToggle />
          <NavLogoutButton
            variant="outlined"
            size="small"
            onClick={handleLogout}
          >
            Logout
          </NavLogoutButton>
        </NavActions>
      </NavBar>

      <MainContent>
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

        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          mb={3}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <HistoryTitleIcon />
            <Typography fontWeight={700} fontSize="1.2rem" color="text.primary">
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

        {loading ? (
          <HistoryListSkeleton />
        ) : history.length === 0 ? (
          <EmptyHistoryBox>
            <EmptyQuestionIcon />
            <Typography fontSize="1.1rem" mb={1}>
              No conversations yet
            </Typography>
            <Typography fontSize="0.875rem" mb={3}>
              Upload a PDF and start asking questions!
            </Typography>
            <DashboardButton
              variant="outlined"
              onClick={() => navigate("/dashboard")}
            >
              Go to Dashboard
            </DashboardButton>
          </EmptyHistoryBox>
        ) : (
          history.map((item) => (
            <HistoryCard key={item.id}>
              <HistoryCardHeader>
                <Box display="flex" alignItems="center" gap={1} flex={1}>
                  {item.documentName && (
                    <DocBadge>
                      <DocPdfIcon />
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
                  {item.documentId && (
                    <Tooltip title="Continue chatting">
                      <ChatAgainButton
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
                      >
                        <Chat fontSize="small" />
                      </ChatAgainButton>
                    </Tooltip>
                  )}

                  <Tooltip title="Delete this conversation">
                    <DeleteConversationButton
                      size="small"
                      onClick={() => handleDeleteOne(item.id)}
                      disabled={deletingId === item.id}
                    >
                      {deletingId === item.id ? (
                        <CircularProgress size={14} />
                      ) : (
                        <Delete fontSize="small" />
                      )}
                    </DeleteConversationButton>
                  </Tooltip>

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

              <HistoryCardBody>
                <QuestionText>
                  <span style={{ fontSize: "1.1rem" }}>🙋</span>
                  {item.question}
                </QuestionText>

                <AnswerSourceRow>
                  {item.answerSource === "ai_fallback" ? (
                    <AISourceBadge>
                      <AnswerWarningIcon />
                      AI General Knowledge
                    </AISourceBadge>
                  ) : (
                    <DocumentSourceBadge>
                      <AnswerCheckIcon />
                      From Document
                    </DocumentSourceBadge>
                  )}
                </AnswerSourceRow>

                <Collapse in={expandedId === item.id} collapsedSize={72}>
                  {item.answerSource === "ai_fallback" ? (
                    <CollapsibleAnswerAI isExpanded={expandedId === item.id}>
                      <MarkdownAnswer>
                        <ReactMarkdown>{item.answer}</ReactMarkdown>
                      </MarkdownAnswer>
                    </CollapsibleAnswerAI>
                  ) : (
                    <CollapsibleAnswerDocument
                      isExpanded={expandedId === item.id}
                    >
                      <MarkdownAnswer>
                        <ReactMarkdown>{item.answer}</ReactMarkdown>
                      </MarkdownAnswer>
                    </CollapsibleAnswerDocument>
                  )}
                </Collapse>

                <AnswerMetaRow>
                  {item.answerSource === "document" &&
                    item.sources &&
                    item.sources.length > 0 && (
                      <MetaText>
                        📎 {item.sources.length} source
                        {item.sources.length > 1 ? "s" : ""} used
                      </MetaText>
                    )}
                  <MetaText>💬 {item.answer.split(" ").length} words</MetaText>
                </AnswerMetaRow>
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
