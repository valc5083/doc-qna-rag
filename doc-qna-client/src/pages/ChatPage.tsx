import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Box,
  CircularProgress,
  Typography,
  Chip,
  Drawer,
  List,
  ListItem,
  Divider,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Select,
  FormControl,
} from "@mui/material";
import {
  Send,
  ArrowBack,
  History,
  Warning,
  CheckCircle,
  Download,
  Share,
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import ReactMarkdown from "react-markdown";
import { qnaApi } from "../api/qnaApi";
import { documentApi } from "../api/documentApi";
import { shareApi } from "../api/shareApi";
import type {
  ChatBubble,
  ConfidenceScore,
  DocumentListResponse,
  ImageSourceChunk,
  SourceChunk,
  ChatHistoryItem,
} from "../types";
import SourceViewer from "../components/SourceViewer";
import DocumentSummary from "../components/DocumentSummary";
import SuggestedQuestions from "../components/SuggestedQuestions";
import ConfidenceIndicator from "../components/ConfidenceIndicator";
import {
  ChatLayout,
  ChatHeader,
  ChatHeaderTitle,
  ChatHeaderSubtitle,
  BackButton,
  MessagesArea,
  UserBubble,
  InputArea,
  QuestionInput,
  SendButton,
  EmptyChat,
  EmptyChatIcon,
  EmptyChatText,
  EmptyChatSub,
  FallbackWarning,
  FallbackWarningTitle,
  FallbackWarningText,
  FallbackReasonText,
  DocumentSourceBadge,
  AnswerContainer,
  AssistantBubbleDocument,
  AssistantBubbleAI,
  MarkdownContent,
} from "../components/styles/ChatStyles";
import usePageTitle from "../hooks/usePageTitle";
import VoiceInput from "../components/VoiceInput";
import { exportAsMarkdown, exportAsPDF } from "../utils/exportChat";
import ImageSourceViewer from "../components/ImageSourceViewer";
import DarkModeToggle from "../components/DarkModeToggle";

const HeaderBackColumn = styled(Box)({
  display: "flex",
  justifyContent: "flex-start",
  gridColumn: "1 / 2",
});

const HeaderCenterColumn = styled(Box)(({ theme }) => ({
  gridColumn: "2 / 3",
  justifySelf: "center",
  width: "100%",
  minWidth: 0,
  paddingLeft: theme.spacing(0.5),
  paddingRight: theme.spacing(0.5),
  [theme.breakpoints.up("sm")]: {
    paddingLeft: 0,
    paddingRight: 0,
  },
}));

const HeaderRightColumn = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: 8,
  gridColumn: "3 / 4",
});

const StatusChip = styled(Chip)(({ theme }) => ({
  background: "rgba(255,255,255,0.2)",
  color: "#ffffff",
  fontSize: "0.75rem",
  display: "none",
  [theme.breakpoints.up("sm")]: {
    display: "inline-flex",
  },
}));

const HeaderActionIconButton = styled(IconButton)({
  color: "#ffffff",
  width: 34,
  height: 34,
});

const ExportIconButton = styled(HeaderActionIconButton, {
  shouldForwardProp: (prop) => prop !== "isVisible",
})<{ isVisible: boolean }>(({ isVisible }) => ({
  visibility: isVisible ? "visible" : "hidden",
}));

const ExportMenu = styled(Menu)({
  "& .MuiPaper-root": {
    borderRadius: 8,
    minWidth: 180,
  },
});

const LanguageFormControl = styled(FormControl)({
  minWidth: 120,
});

const LanguageSelect = styled(Select)({
  color: "#ffffff",
  fontSize: "0.8rem",
  ".MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(255,255,255,0.3)",
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(255,255,255,0.6)",
  },
  ".MuiSvgIcon-root": {
    color: "#ffffff",
  },
});

const SummarySuggestionsPanel = styled(Box)({
  padding: 16,
  borderBottom: "1px solid #E0E0E0",
});

const WarningIcon = styled(Warning)({
  fontSize: 18,
});

const SourceCheckIcon = styled(CheckCircle)({
  fontSize: 14,
});

const ThinkingBubble = styled(Box)(({ theme }) => ({
  alignSelf: "flex-start",
  borderRadius: "18px 18px 18px 4px",
  padding: "14px 20px",
  background: theme.palette.background.paper,
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  border: `1px solid ${theme.palette.divider}`,
  display: "flex",
  alignItems: "center",
  gap: 8,
}));

const ThinkingText = styled(Typography)(({ theme }) => ({
  fontSize: "0.9rem",
  color: theme.palette.text.secondary,
  fontStyle: "italic",
}));

const HistoryDrawer = styled(Drawer)({
  "& .MuiDrawer-paper": {
    width: 360,
    padding: 16,
  },
});

const HistoryDivider = styled(Divider)({
  marginBottom: 16,
});

const HistoryItem = styled(ListItem)(({ theme }) => ({
  marginBottom: 8,
  background: theme.palette.mode === "dark" ? "#121926" : "#F5F8FB",
  borderRadius: 8,
  padding: 12,
  flexDirection: "column",
  alignItems: "flex-start",
  cursor: "pointer",
  "&:hover": {
    background: theme.palette.mode === "dark" ? "#1E293B" : "#EBF3FB",
  },
}));

const ChatPage = () => {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const mode = location.state?.mode || "fresh";
  const selectedHistoryId = location.state?.selectedHistoryId;

  const [document, setDocument] = useState<DocumentListResponse | null>(null);
  usePageTitle(
    document?.originalFileName ? `Chat — ${document.originalFileName}` : "Chat",
  );
  const [messages, setMessages] = useState<ChatBubble[]>([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [exportAnchor, setExportAnchor] = useState<null | HTMLElement>(null);
  const [shareLoading, setShareLoading] = useState(false);

  const [language, setLanguage] = useState("en");

  const languages = [
    { code: "en", label: "🇬🇧 English" },
    { code: "hi", label: "🇮🇳 Hindi" },
    { code: "ta", label: "🇮🇳 Tamil" },
    { code: "te", label: "🇮🇳 Telugu" },
    { code: "bn", label: "🇮🇳 Bengali" },
    { code: "mr", label: "🇮🇳 Marathi" },
    { code: "bh", label: "🇮🇳 Bhojpuri" },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    setMessages([]);
    setChatHistory([]);
  }, [documentId]);

  useEffect(() => {
    if (location.state?.scrollToBottom) {
      setTimeout(() => scrollToBottom(), 300);
    }
  }, [location.state]);

  useEffect(() => {
    if (!documentId) return;

    // Load document
    documentApi.getAll().then((docs) => {
      const doc = docs.find((d) => d.id === documentId);
      if (doc) setDocument(doc);
    });

    // 🧠 CONTROL BEHAVIOR HERE
    if (mode === "fresh") {
      setMessages([]); // ✅ clear everything
      return;
    }

    if (mode === "history") {
      qnaApi
        .getHistory(20)
        .then((history) => {
          const docHistory = history
            .filter((item) => item.documentId === documentId)
            .reverse(); // oldest first

          const bubbles: ChatBubble[] = [];

          for (const item of docHistory) {
            bubbles.push({
              id: `history-user-${item.id}`,
              type: "user",
              content: item.question,
              createdAt: item.createdAt,
            });

            bubbles.push({
              id: `history-assistant-${item.id}`,
              type: "assistant",
              content: item.answer,
              sources: Array.isArray(item.sources) ? item.sources : [],
              createdAt: item.createdAt,
              answerSource: item.answerSource,
              fallbackReason: item.fallbackReason,
            });

            // ⭐ stop at selected item
            if (selectedHistoryId && item.id === selectedHistoryId) {
              break;
            }
          }

          setMessages(bubbles);
          setChatHistory(docHistory);
        })
        .catch(() => {});
    }
  }, [documentId, mode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      eventSourceRef.current?.close();
    };
  }, []);

  useEffect(() => {
    qnaApi
      .getHistory(10)
      .then((h) => {
        const docHistory = h.filter((item) => item.documentId === documentId);
        setChatHistory(docHistory);
      })
      .catch(() => {});
  }, [documentId]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => scrollToBottom(), 100);
    }
  }, []);

  const handleAsk = useCallback(async () => {
    if (!question.trim() || !documentId || loading) return;

    const userQuestion = question.trim();
    const request = {
      question: userQuestion,
      documentId,
      language,
    };

    setQuestion("");
    setLoading(true);
    setStatusText("");

    // Add user bubble
    const userBubble: ChatBubble = {
      id: Date.now().toString(),
      type: "user",
      content: userQuestion,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userBubble]);

    // Create assistant bubble placeholder
    const assistantId = (Date.now() + 1).toString();
    setStreamingId(assistantId);

    const assistantBubble: ChatBubble = {
      id: assistantId,
      type: "assistant",
      content: "",
      sources: [],
      createdAt: new Date().toISOString(),
      answerSource: "document",
      fallbackReason: undefined,
    };
    setMessages((prev) => [...prev, assistantBubble]);

    // Get token for EventSource auth
    const token = localStorage.getItem("accessToken") || "";

    // Start streaming
    eventSourceRef.current = qnaApi.askStream(
      request.question,
      request.documentId,
      token,
      request.language,

      // onToken — append each token to the assistant bubble
      (token) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId
              ? { ...msg, content: msg.content + token }
              : msg,
          ),
        );
        scrollToBottom();
      },

      // onSources — attach sources to the assistant bubble
      (sources: SourceChunk[]) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId ? { ...msg, sources } : msg,
          ),
        );
      },

      // onImageSources — attach image sources to the assistant bubble
      (imageSources: ImageSourceChunk[]) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId ? { ...msg, imageSources } : msg,
          ),
        );
      },

      // onMetadata — attach answer source metadata
      (answerSource: "document" | "ai_fallback", fallbackReason?: string) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId
              ? { ...msg, answerSource, fallbackReason }
              : msg,
          ),
        );
      },

      // onStatus — show status text
      (status) => {
        setStatusText(status);
      },

      // onConfidence — attach confidence score
      (confidence: ConfidenceScore) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId ? { ...msg, confidence } : msg,
          ),
        );
      },

      // onDone
      () => {
        setLoading(false);
        setStatusText("");
        setStreamingId(null);
        eventSourceRef.current = null;
        qnaApi
          .getHistory(10)
          .then((h) => {
            setChatHistory(h.filter((item) => item.documentId === documentId));
          })
          .catch(() => {});
      },

      // onError
      (error) => {
        toast.error("Something went wrong. Please try again.");
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId ? { ...msg, content: `❌ ${error}` } : msg,
          ),
        );
        setLoading(false);
        setStatusText("");
        setStreamingId(null);
      },
    );
  }, [question, documentId, language, loading]);

  const handleHistoryClick = (selectedItem: ChatHistoryItem) => {
    if (!documentId) return;

    const sorted = [...chatHistory].reverse(); // oldest first
    const bubbles: ChatBubble[] = [];

    for (const item of sorted) {
      bubbles.push({
        id: `history-user-${item.id}`,
        type: "user",
        content: item.question,
        createdAt: item.createdAt,
      });

      bubbles.push({
        id: `history-assistant-${item.id}`,
        type: "assistant",
        content: item.answer,
        sources: Array.isArray(item.sources) ? item.sources : [],
        createdAt: item.createdAt,
        answerSource: item.answerSource,
        fallbackReason: item.fallbackReason,
      });

      if (item.id === selectedItem.id) break; // ✅ correct stop
    }

    setMessages(bubbles);
    setHistoryOpen(false);

    setTimeout(() => scrollToBottom(), 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  const handleShare = async () => {
    if (!documentId) return;

    try {
      setShareLoading(true);
      const shareMessages = messages
        .filter((m) => m.content)
        .map((m) => ({
          type: m.type,
          content: m.content,
          sources: m.sources ?? [],
        }));

      const result = await shareApi.create({
        documentId,
        title: `Chat about ${document?.originalFileName}`,
        messages: shareMessages,
        expiryDays: 30,
      });

      await navigator.clipboard.writeText(result.shareUrl);
      toast.success("Share link copied to clipboard! 🔗");
    } catch {
      toast.error("Failed to create share link.");
    } finally {
      setShareLoading(false);
    }
  };

  return (
    <ChatLayout>
      {/* Header */}
      <ChatHeader>
        <HeaderBackColumn>
          <BackButton
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={() => navigate(-1)}
          >
            Back
          </BackButton>
        </HeaderBackColumn>

        <HeaderCenterColumn>
          <ChatHeaderTitle>🤖 DocQnA Chat</ChatHeaderTitle>
          <ChatHeaderSubtitle>
            {document ? `📄 ${document.originalFileName}` : "Loading..."}
          </ChatHeaderSubtitle>
        </HeaderCenterColumn>

        <HeaderRightColumn>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="flex-end"
            gap={1}
            flexWrap="nowrap"
          >
            {statusText && <StatusChip label={statusText} size="small" />}

            {messages.length > 1 && (
              <Tooltip title="Share this chat">
                <span>
                  <HeaderActionIconButton
                    size="small"
                    onClick={handleShare}
                    disabled={shareLoading}
                  >
                    {shareLoading ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <Share />
                    )}
                  </HeaderActionIconButton>
                </span>
              </Tooltip>
            )}

            <Tooltip title={messages.length > 0 ? "Export chat" : ""}>
              <span>
                <ExportIconButton
                  size="small"
                  isVisible={messages.length > 0}
                  onClick={(e) => setExportAnchor(e.currentTarget)}
                >
                  <Download />
                </ExportIconButton>
              </span>
            </Tooltip>

            {messages.length > 0 && (
              <>
                <ExportMenu
                  anchorEl={exportAnchor}
                  open={Boolean(exportAnchor)}
                  onClose={() => setExportAnchor(null)}
                >
                  <MenuItem
                    onClick={() => {
                      exportAsMarkdown(
                        messages,
                        document?.originalFileName || "document",
                      );
                      setExportAnchor(null);
                      toast.success("Exported as Markdown!");
                    }}
                  >
                    <ListItemIcon>
                      <Download fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Export as Markdown</ListItemText>
                  </MenuItem>

                  <MenuItem
                    onClick={async () => {
                      try {
                        await exportAsPDF(
                          messages,
                          document?.originalFileName || "document",
                        );
                        toast.success("Exported as PDF!");
                      } catch {
                        toast.error("Failed to export PDF.");
                      } finally {
                        setExportAnchor(null);
                      }
                    }}
                  >
                    <ListItemIcon>
                      <Download fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Export as PDF</ListItemText>
                  </MenuItem>
                </ExportMenu>
              </>
            )}

            <HeaderActionIconButton
              onClick={() => setHistoryOpen(true)}
              size="small"
              title="View history"
            >
              <History />
            </HeaderActionIconButton>
            <LanguageFormControl size="small">
              <LanguageSelect
                value={language}
                onChange={(e) => setLanguage(e.target.value as string)}
              >
                {languages.map((l) => (
                  <MenuItem key={l.code} value={l.code} dense>
                    {l.label}
                  </MenuItem>
                ))}
              </LanguageSelect>
            </LanguageFormControl>
            <DarkModeToggle />
          </Box>
        </HeaderRightColumn>
      </ChatHeader>

      {messages.length === 0 && documentId && (
        <SummarySuggestionsPanel>
          <DocumentSummary documentId={documentId} />
          <SuggestedQuestions
            documentId={documentId}
            onSelectQuestion={(q) => setQuestion(q)}
          />
        </SummarySuggestionsPanel>
      )}

      {/* Messages */}
      <MessagesArea>
        {messages.length === 0 && !loading ? (
          <EmptyChat>
            <EmptyChatIcon>💬</EmptyChatIcon>
            <EmptyChatText>Ask anything about your document</EmptyChatText>
            <EmptyChatSub>
              Try: "What is this document about?" or "Summarize the key points"
            </EmptyChatSub>
          </EmptyChat>
        ) : (
          <>
            {messages.map((msg) => (
              <Box key={msg.id} display="flex" flexDirection="column">
                {msg.type === "user" ? (
                  <UserBubble>{msg.content}</UserBubble>
                ) : msg.content ? (
                  <AnswerContainer>
                    {/* AI Fallback Warning */}
                    {msg.answerSource === "ai_fallback" && (
                      <FallbackWarning>
                        <FallbackWarningTitle>
                          <WarningIcon />
                          AI General Knowledge
                        </FallbackWarningTitle>
                        <FallbackWarningText>
                          This answer is from AI general knowledge (not found in
                          your document)
                        </FallbackWarningText>
                        {msg.fallbackReason && (
                          <FallbackReasonText>
                            Reason: {msg.fallbackReason}
                          </FallbackReasonText>
                        )}
                      </FallbackWarning>
                    )}

                    {/* Document Answer Indicator */}
                    {msg.answerSource === "document" &&
                      msg.sources &&
                      msg.sources.length > 0 && (
                        <DocumentSourceBadge>
                          <SourceCheckIcon />
                          From document ({msg.sources.length} source
                          {msg.sources.length > 1 ? "s" : ""})
                        </DocumentSourceBadge>
                      )}

                    {/* Answer Bubble with conditional styling */}
                    {msg.answerSource === "ai_fallback" ? (
                      <AssistantBubbleAI elevation={0}>
                        <MarkdownContent>
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                          {streamingId === msg.id && (
                            <span
                              style={{
                                display: "inline-block",
                                width: 2,
                                height: "1em",
                                background: "#ed6c02",
                                marginLeft: 2,
                                animation: "blink 1s step-end infinite",
                                verticalAlign: "text-bottom",
                              }}
                            />
                          )}
                        </MarkdownContent>
                        <ConfidenceIndicator confidence={msg.confidence} />
                      </AssistantBubbleAI>
                    ) : (
                      <AssistantBubbleDocument elevation={0}>
                        <MarkdownContent>
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                          {streamingId === msg.id && (
                            <span
                              style={{
                                display: "inline-block",
                                width: 2,
                                height: "1em",
                                background: "#2E75B6",
                                marginLeft: 2,
                                animation: "blink 1s step-end infinite",
                                verticalAlign: "text-bottom",
                              }}
                            />
                          )}
                        </MarkdownContent>
                        <ConfidenceIndicator confidence={msg.confidence} />
                        {Array.isArray(msg.sources) &&
                          msg.sources.length > 0 && (
                            <SourceViewer sources={msg.sources} />
                          )}
                        <ImageSourceViewer imageSources={msg.imageSources} />
                      </AssistantBubbleDocument>
                    )}
                  </AnswerContainer>
                ) : (
                  // ← Thinking bubble OUTSIDE AssistantBubble
                  <ThinkingBubble>
                    <CircularProgress size={16} />
                    <ThinkingText>{statusText || "Thinking..."}</ThinkingText>
                  </ThinkingBubble>
                )}
              </Box>
            ))}
          </>
        )}
        <div ref={messagesEndRef} />
      </MessagesArea>

      {/* Cursor blink CSS */}
      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>

      {/* Input */}
      <InputArea>
        <QuestionInput
          fullWidth
          multiline
          maxRows={4}
          placeholder="Ask a question... (Enter to send, Shift+Enter for new line)"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          variant="outlined"
        />
        <VoiceInput
          onTranscript={(text) =>
            setQuestion((prev) => (prev ? `${prev} ${text}` : text))
          }
          disabled={loading}
        />
        <SendButton onClick={handleAsk} disabled={loading || !question.trim()}>
          {loading ? <CircularProgress size={20} color="inherit" /> : <Send />}
        </SendButton>
      </InputArea>

      {/* History Drawer */}
      <HistoryDrawer
        anchor="right"
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
      >
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          mb={2}
        >
          <Typography fontWeight={700} fontSize="1.1rem" color="text.primary">
            📜 Recent Questions
          </Typography>
          <IconButton onClick={() => setHistoryOpen(false)}>✕</IconButton>
        </Box>
        <HistoryDivider />

        {chatHistory.length === 0 ? (
          <Typography color="text.secondary" fontSize="0.875rem">
            No history for this document yet.
          </Typography>
        ) : (
          <List disablePadding>
            {chatHistory.map((item) => (
              <HistoryItem
                key={item.id}
                disablePadding
                onClick={() => handleHistoryClick(item)}
              >
                <Typography
                  fontSize="0.85rem"
                  fontWeight={600}
                  color="text.primary"
                  mb={0.5}
                >
                  🙋{" "}
                  {item.question.length > 60
                    ? item.question.substring(0, 60) + "..."
                    : item.question}
                </Typography>
                <Typography fontSize="0.75rem" color="text.secondary">
                  {item.answer.substring(0, 80)}...
                </Typography>
                <Typography fontSize="0.7rem" color="text.secondary" mt={0.5}>
                  {new Date(item.createdAt).toLocaleDateString("en-IN")}
                </Typography>
              </HistoryItem>
            ))}
          </List>
        )}
      </HistoryDrawer>
    </ChatLayout>
  );
};

export default ChatPage;
