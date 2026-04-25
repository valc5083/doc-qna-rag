import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Box, CircularProgress, Typography, Chip } from "@mui/material";
import ReactMarkdown from "react-markdown";
import { shareApi } from "../api/shareApi";
import type { SharedChatResponse } from "../types";
import SourceViewer from "../components/SourceViewer";
import { styled } from "@mui/material/styles";

const PageWrapper = styled(Box)({
  minHeight: "100vh",
  background: "#F0F4F8",
});

const Header = styled(Box)({
  background: "linear-gradient(135deg, #1F4E79, #2E75B6)",
  padding: "20px 32px",
});

const MessageArea = styled(Box)({
  maxWidth: 800,
  margin: "24px auto",
  padding: "0 16px",
});

const UserMsg = styled(Box)({
  background: "linear-gradient(135deg, #1F4E79, #2E75B6)",
  color: "#ffffff",
  borderRadius: "18px 18px 4px 18px",
  padding: "12px 16px",
  marginLeft: "auto",
  maxWidth: "70%",
  marginBottom: 12,
  fontSize: "0.95rem",
});

const AssistantMsg = styled(Box)({
  background: "#ffffff",
  borderRadius: "18px 18px 18px 4px",
  padding: "16px 20px",
  maxWidth: "75%",
  marginBottom: 12,
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  fontSize: "0.95rem",
});

const HeaderChip = styled(Chip, {
  shouldForwardProp: (prop) => prop !== "chipBackground",
})<{ chipBackground: string }>(({ chipBackground }) => ({
  background: chipBackground,
  color: "#ffffff",
  fontSize: "0.75rem",
}));

const AssistantMarkdown = styled(Box)({
  "& p": { margin: "0 0 8px 0" },
  lineHeight: 1.6,
});

const FooterLink = styled("a")({
  color: "#2E75B6",
});

const SharedChatPage = () => {
  const { token } = useParams<{ token: string }>();
  const [chat, setChat] = useState<SharedChatResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    shareApi
      .getShared(token)
      .then(setChat)
      .catch(() => setError("Share link not found or expired."))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading)
    return (
      <Box display="flex" justifyContent="center" pt={8}>
        <CircularProgress />
      </Box>
    );

  if (error)
    return (
      <Box display="flex" justifyContent="center" pt={8}>
        <Typography color="error">{error}</Typography>
      </Box>
    );

  if (!chat) return null;

  return (
    <PageWrapper>
      <Header>
        <Typography variant="h6" color="white" fontWeight={700}>
          🤖 DocQnA — Shared Chat
        </Typography>
        <Typography color="rgba(255,255,255,0.8)" fontSize="0.875rem" mt={0.5}>
          📄 {chat.documentName}
        </Typography>
        <Box display="flex" gap={1} mt={1} flexWrap="wrap">
          <HeaderChip
            label={chat.title}
            size="small"
            chipBackground="rgba(255,255,255,0.2)"
          />
          <HeaderChip
            label={`${chat.viewCount} views`}
            size="small"
            chipBackground="rgba(255,255,255,0.15)"
          />
          <HeaderChip
            label={`Expires ${new Date(chat.expiresAt).toLocaleDateString(
              "en-IN",
            )}`}
            size="small"
            chipBackground="rgba(255,255,255,0.15)"
          />
        </Box>
      </Header>

      <MessageArea>
        {chat.messages.map((msg, i) => (
          <Box key={i}>
            {msg.type === "user" ? (
              <UserMsg>{msg.content}</UserMsg>
            ) : (
              <AssistantMsg>
                <AssistantMarkdown>
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </AssistantMarkdown>
                {msg.sources && msg.sources.length > 0 && (
                  <SourceViewer sources={msg.sources} />
                )}
              </AssistantMsg>
            )}
          </Box>
        ))}

        <Box textAlign="center" py={4}>
          <Typography fontSize="0.8rem" color="#AAAAAA">
            Shared with DocQnA •{" "}
            <FooterLink href="/">Try it yourself</FooterLink>
          </Typography>
        </Box>
      </MessageArea>
    </PageWrapper>
  );
};

export default SharedChatPage;
