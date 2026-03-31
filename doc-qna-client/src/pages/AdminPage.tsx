import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Delete,
  Refresh,
  ArrowBack,
  People,
  Description,
  Chat,
  FolderOpen,
  Storage,
} from "@mui/icons-material";
import toast from "react-hot-toast";
import { adminApi } from "../api/adminApi";
import { useAuthStore } from "../store/authStore";
import { authApi } from "../api/authApi";
import type {
  AdminStats,
  AdminUser,
  AdminDocument,
  AdminConversation,
} from "../types";
import {
  AdminLayout,
  AdminNav,
  AdminNavLeft,
  AdminNavActions,
  AdminNavEmail,
  AdminNavTitle,
  AdminContent,
  AdminTabs,
  StatsGrid,
  StatBox,
  StatValue,
  StatLabel,
  AdminCard,
  AdminCardHeader,
  AdminCardTitle,
  AdminTable,
  TableHeader,
  TableRow,
  TabButton,
  BadgeChip,
} from "../components/styles/AdminStyles";
import usePageTitle from "../hooks/usePageTitle";
import ConfirmationDialog from "../components/ConfirmationDialog";

type Tab = "overview" | "users" | "documents" | "conversations";

const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const AdminPage = () => {
  const navigate = useNavigate();
  const { email, logout } = useAuthStore();
  usePageTitle("Admin Dashboard");

  const [tab, setTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [documents, setDocuments] = useState<AdminDocument[]>([]);
  const [conversations, setConversations] = useState<AdminConversation[]>([]);
  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "overview", label: "Overview", icon: <Storage fontSize="small" /> },
    { key: "users", label: "Users", icon: <People fontSize="small" /> },
    {
      key: "documents",
      label: "Documents",
      icon: <Description fontSize="small" />,
    },
    { key: "conversations", label: "Chats", icon: <Chat fontSize="small" /> },
  ];
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogConfig, setDialogConfig] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [s, u, d, c] = await Promise.all([
        adminApi.getStats(),
        adminApi.getUsers(),
        adminApi.getDocuments(),
        adminApi.getConversations(),
      ]);
      setStats(s);
      setUsers(u);
      setDocuments(d);
      setConversations(c);
    } catch (err: any) {
      if (err.response?.status === 403) {
        toast.error("Admin access required.");
        navigate("/dashboard");
      } else {
        toast.error("Failed to load admin data.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleDeleteUser = (userId: string, userEmail: string) => {
    setDialogConfig({
      title: "Delete User",
      message: `Are you sure you want to delete "${userEmail}"?\n\nThis will remove all their data permanently.`,
      onConfirm: async () => {
        try {
          await adminApi.deleteUser(userId);
          setUsers((prev) => prev.filter((u) => u.id !== userId));
          toast.success(`User "${userEmail}" deleted.`);
        } catch {
          toast.error("Failed to delete user.");
        } finally {
          setDialogOpen(false);
        }
      },
    });
    setDialogOpen(true);
  };

  const handleDeleteDocument = (docId: string, docName: string) => {
    setDialogConfig({
      title: "Delete Document",
      message: `Are you sure you want to delete "${docName}"?`,
      onConfirm: async () => {
        try {
          await adminApi.deleteDocument(docId);
          setDocuments((prev) => prev.filter((d) => d.id !== docId));
          toast.success(`"${docName}" deleted.`);
        } catch {
          toast.error("Failed to delete document.");
        } finally {
          setDialogOpen(false);
        }
      },
    });
    setDialogOpen(true);
  };

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem("refreshToken") || "";
    await authApi.logout(refreshToken);
    logout();
    navigate("/login");
  };

  const statusColor = (status: string) => {
    if (status === "ready") return "#4CAF50";
    if (status === "processing") return "#FF9800";
    return "#F44336";
  };

  return (
    <AdminLayout>
      {/* Nav */}
      <AdminNav>
        <AdminNavLeft>
          <IconButton
            onClick={() => navigate("/dashboard")}
            sx={{ color: "#8B8FA8" }}
          >
            <ArrowBack />
          </IconButton>
          <AdminNavTitle>🛡️ Admin Dashboard</AdminNavTitle>
        </AdminNavLeft>
        <AdminNavActions>
          <AdminNavEmail>{email}</AdminNavEmail>
          <Tooltip title="Refresh data">
            <IconButton
              onClick={fetchAll}
              sx={{ color: "#8B8FA8" }}
              disabled={loading}
            >
              <Refresh />
            </IconButton>
          </Tooltip>
          <Button
            variant="outlined"
            size="small"
            onClick={handleLogout}
            sx={{
              color: "#8B8FA8",
              borderColor: "#2A2D3E",
              textTransform: "none",
              borderRadius: 2,
              "&:hover": {
                borderColor: "#8B8FA8",
                background: "transparent",
              },
            }}
          >
            Logout
          </Button>
        </AdminNavActions>
      </AdminNav>

      <AdminContent>
        {loading ? (
          <Box textAlign="center" py={8}>
            <CircularProgress sx={{ color: "#2E75B6" }} />
            <Typography color="#8B8FA8" mt={2}>
              Loading admin data...
            </Typography>
          </Box>
        ) : (
          <>
            {/* Tabs */}
            <AdminTabs>
              {tabs.map((t) => (
                <TabButton
                  key={t.key}
                  active={tab === t.key}
                  onClick={() => setTab(t.key)}
                >
                  {t.icon}
                  {t.label}
                </TabButton>
              ))}
            </AdminTabs>

            {/* ── OVERVIEW ── */}
            {tab === "overview" && stats && (
              <>
                <StatsGrid>
                  <StatBox accent="#2E75B6">
                    <StatValue>{stats.totalUsers}</StatValue>
                    <StatLabel>Total Users</StatLabel>
                  </StatBox>
                  <StatBox accent="#4CAF50">
                    <StatValue>{stats.totalDocuments}</StatValue>
                    <StatLabel>Total Documents</StatLabel>
                  </StatBox>
                  <StatBox accent="#FF9800">
                    <StatValue>{stats.totalConversations}</StatValue>
                    <StatLabel>Conversations</StatLabel>
                  </StatBox>
                  <StatBox accent="#9C27B0">
                    <StatValue>{stats.totalCollections}</StatValue>
                    <StatLabel>Collections</StatLabel>
                  </StatBox>
                  <StatBox accent="#F44336">
                    <StatValue>
                      {formatBytes(stats.totalStorageBytes)}
                    </StatValue>
                    <StatLabel>Total Storage</StatLabel>
                  </StatBox>
                </StatsGrid>

                {/* Document Status Breakdown */}
                <AdminCard>
                  <AdminCardHeader>
                    <AdminCardTitle>📄 Document Status</AdminCardTitle>
                  </AdminCardHeader>
                  <Box p={3} display="flex" gap={3}>
                    <Box textAlign="center">
                      <Typography
                        fontSize="1.8rem"
                        fontWeight={700}
                        color="#4CAF50"
                      >
                        {stats.readyDocuments}
                      </Typography>
                      <Typography fontSize="0.8rem" color="#8B8FA8">
                        Ready
                      </Typography>
                    </Box>
                    <Box textAlign="center">
                      <Typography
                        fontSize="1.8rem"
                        fontWeight={700}
                        color="#FF9800"
                      >
                        {stats.processingDocuments}
                      </Typography>
                      <Typography fontSize="0.8rem" color="#8B8FA8">
                        Processing
                      </Typography>
                    </Box>
                    <Box textAlign="center">
                      <Typography
                        fontSize="1.8rem"
                        fontWeight={700}
                        color="#F44336"
                      >
                        {stats.failedDocuments}
                      </Typography>
                      <Typography fontSize="0.8rem" color="#8B8FA8">
                        Failed
                      </Typography>
                    </Box>
                  </Box>
                </AdminCard>

                {/* Server Info */}
                <AdminCard>
                  <AdminCardHeader>
                    <AdminCardTitle>⚙️ Server Info</AdminCardTitle>
                  </AdminCardHeader>
                  <Box p={3}>
                    <Typography color="#8B8FA8" fontSize="0.875rem">
                      Server Time:{" "}
                      <span style={{ color: "#ffffff" }}>
                        {formatDate(stats.serverTime)}
                      </span>
                    </Typography>
                  </Box>
                </AdminCard>
              </>
            )}

            {/* ── USERS ── */}
            {tab === "users" && (
              <AdminCard>
                <AdminCardHeader>
                  <AdminCardTitle>👥 Users ({users.length})</AdminCardTitle>
                </AdminCardHeader>
                <AdminTable>
                  <TableHeader
                    sx={{
                      gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr 60px",
                    }}
                  >
                    <span>Email</span>
                    <span>Joined</span>
                    <span>Docs</span>
                    <span>Chats</span>
                    <span>Storage</span>
                    <span>Last Active</span>
                    <span></span>
                  </TableHeader>
                  {users.map((user) => (
                    <TableRow
                      key={user.id}
                      sx={{
                        gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr 60px",
                      }}
                    >
                      <Typography fontSize="0.875rem" color="#ffffff" noWrap>
                        {user.email}
                      </Typography>
                      <span>
                        {new Date(user.createdAt).toLocaleDateString("en-IN")}
                      </span>
                      <span>{user.documentCount}</span>
                      <span>{user.conversationCount}</span>
                      <span>{formatBytes(user.totalStorageBytes)}</span>
                      <span>
                        {user.lastActive
                          ? new Date(user.lastActive).toLocaleDateString(
                              "en-IN",
                            )
                          : "—"}
                      </span>
                      <Tooltip title="Delete user + all data">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteUser(user.id, user.email)}
                          sx={{ color: "#F44336" }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableRow>
                  ))}
                </AdminTable>
              </AdminCard>
            )}

            {/* ── DOCUMENTS ── */}
            {tab === "documents" && (
              <AdminCard>
                <AdminCardHeader>
                  <AdminCardTitle>
                    <Box display="flex" alignItems="center" gap={1}>
                      <FolderOpen fontSize="small" />
                      Documents ({documents.length})
                    </Box>
                  </AdminCardTitle>
                </AdminCardHeader>
                <AdminTable>
                  <TableHeader
                    sx={{
                      gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr 60px",
                    }}
                  >
                    <span>File Name</span>
                    <span>User</span>
                    <span>Status</span>
                    <span>Chunks</span>
                    <span>Size</span>
                    <span></span>
                  </TableHeader>
                  {documents.map((doc) => (
                    <TableRow
                      key={doc.id}
                      sx={{
                        gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr 60px",
                      }}
                    >
                      <Typography
                        fontSize="0.875rem"
                        color="#ffffff"
                        noWrap
                        title={doc.originalFileName}
                      >
                        {doc.originalFileName.length > 30
                          ? doc.originalFileName.substring(0, 30) + "..."
                          : doc.originalFileName}
                      </Typography>
                      <Typography fontSize="0.8rem" color="#8B8FA8" noWrap>
                        {doc.userEmail}
                      </Typography>
                      <BadgeChip color={statusColor(doc.status)}>
                        {doc.status}
                      </BadgeChip>
                      <span>{doc.chunkCount}</span>
                      <span>{formatBytes(doc.fileSizeBytes)}</span>
                      <Tooltip title="Delete document">
                        <IconButton
                          size="small"
                          onClick={() =>
                            handleDeleteDocument(doc.id, doc.originalFileName)
                          }
                          sx={{ color: "#F44336" }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableRow>
                  ))}
                </AdminTable>
              </AdminCard>
            )}

            {/* ── CONVERSATIONS ── */}
            {tab === "conversations" && (
              <AdminCard>
                <AdminCardHeader>
                  <AdminCardTitle>
                    💬 Recent Conversations ({conversations.length})
                  </AdminCardTitle>
                </AdminCardHeader>
                <AdminTable>
                  <TableHeader
                    sx={{
                      gridTemplateColumns: "2fr 2fr 1.5fr 1fr 1fr",
                    }}
                  >
                    <span>Question</span>
                    <span>Answer Preview</span>
                    <span>User</span>
                    <span>Sources</span>
                    <span>Date</span>
                  </TableHeader>
                  {conversations.map((convo) => (
                    <TableRow
                      key={convo.id}
                      sx={{
                        gridTemplateColumns: "2fr 2fr 1.5fr 1fr 1fr",
                      }}
                    >
                      <Typography
                        fontSize="0.875rem"
                        color="#ffffff"
                        noWrap
                        title={convo.question}
                      >
                        {convo.question.length > 50
                          ? convo.question.substring(0, 50) + "..."
                          : convo.question}
                      </Typography>
                      <Typography
                        fontSize="0.8rem"
                        color="#8B8FA8"
                        noWrap
                        title={convo.answer}
                      >
                        {convo.answer}
                      </Typography>
                      <Typography fontSize="0.8rem" color="#8B8FA8" noWrap>
                        {convo.userEmail}
                      </Typography>
                      <span>{convo.sourceCount}</span>
                      <span>
                        {new Date(convo.createdAt).toLocaleDateString("en-IN")}
                      </span>
                    </TableRow>
                  ))}
                </AdminTable>
              </AdminCard>
            )}
          </>
        )}
      </AdminContent>
      <ConfirmationDialog
        open={dialogOpen}
        type="confirm"
        title={dialogConfig?.title || ""}
        message={dialogConfig?.message || ""}
        onClose={() => setDialogOpen(false)}
        onConfirm={dialogConfig?.onConfirm}
      />
    </AdminLayout>
  );
};

export default AdminPage;
