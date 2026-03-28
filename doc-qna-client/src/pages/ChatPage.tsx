import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, CircularProgress, Typography, Chip } from "@mui/material";
import { Send, ArrowBack } from "@mui/icons-material";
import ReactMarkdown from "react-markdown";
import { qnaApi } from "../api/qnaApi";
import { documentApi } from "../api/documentApi";
import type { ChatBubble, DocumentListResponse, SourceChunk } from "../types";
import SourceViewer from "../components/SourceViewer";
import {
  ChatLayout,
  ChatHeader,
  ChatHeaderTitle,
  ChatHeaderSubtitle,
  BackButton,
  MessagesArea,
  UserBubble,
  AssistantBubble,
  ThinkingBubble,
  ThinkingText,
  InputArea,
  QuestionInput,
  SendButton,
  EmptyChat,
  EmptyChatIcon,
  EmptyChatText,
  EmptyChatSub,
} from "../components/styles/ChatStyles";

const ChatPage = () => {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();

  const [document, setDocument] = useState<DocumentListResponse | null>(null);
  const [messages, setMessages] = useState<ChatBubble[]>([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!documentId) return;
    documentApi.getAll().then((docs) => {
      const doc = docs.find((d) => d.id === documentId);
      if (doc) setDocument(doc);
    });
  }, [documentId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      eventSourceRef.current?.close();
    };
  }, []);

  const handleAsk = useCallback(async () => {
    if (!question.trim() || !documentId || loading) return;

    const userQuestion = question.trim();
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
    };
    setMessages((prev) => [...prev, assistantBubble]);

    // Get token for EventSource auth
    const token = localStorage.getItem("accessToken") || "";

    // Start streaming
    eventSourceRef.current = qnaApi.askStream(
      userQuestion,
      documentId,
      token,

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

      // onStatus — show status text
      (status) => {
        setStatusText(status);
      },

      // onDone
      () => {
        setLoading(false);
        setStatusText("");
        setStreamingId(null);
        eventSourceRef.current = null;
      },

      // onError
      (error) => {
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
  }, [question, documentId, loading]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  return (
    <ChatLayout>
      {/* Header */}
      <ChatHeader>
        <Box>
          <ChatHeaderTitle>🤖 DocQnA Chat</ChatHeaderTitle>
          <ChatHeaderSubtitle>
            {document ? `📄 ${document.originalFileName}` : "Loading..."}
          </ChatHeaderSubtitle>
        </Box>
        <Box display="flex" alignItems="center" gap={2}>
          {statusText && (
            <Chip
              label={statusText}
              size="small"
              sx={{
                background: "rgba(255,255,255,0.2)",
                color: "#ffffff",
                fontSize: "0.75rem",
              }}
            />
          )}
          <BackButton
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={() => navigate("/dashboard")}
          >
            Back
          </BackButton>
        </Box>
      </ChatHeader>

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
                  <AssistantBubble elevation={0}>
                    <Typography
                      component="div"
                      sx={{ fontSize: "0.95rem", lineHeight: 1.6 }}
                    >
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
                    </Typography>
                    {Array.isArray(msg.sources) && msg.sources.length > 0 && (
                      <SourceViewer sources={msg.sources} />
                    )}
                  </AssistantBubble>
                ) : (
                  // ← Thinking bubble OUTSIDE AssistantBubble
                  <Box
                    sx={{
                      alignSelf: "flex-start",
                      borderRadius: "18px 18px 18px 4px",
                      padding: "14px 20px",
                      background: "#ffffff",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <CircularProgress size={16} />
                    <Typography
                      sx={{
                        fontSize: "0.9rem",
                        color: "#888888",
                        fontStyle: "italic",
                      }}
                    >
                      {statusText || "Thinking..."}
                    </Typography>
                  </Box>
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
        <SendButton onClick={handleAsk} disabled={loading || !question.trim()}>
          {loading ? <CircularProgress size={20} color="inherit" /> : <Send />}
        </SendButton>
      </InputArea>
    </ChatLayout>
  );
};

export default ChatPage;
