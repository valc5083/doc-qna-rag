import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  History,
  Folder,
  AdminPanelSettings,
  TrendingUp,
} from "@mui/icons-material";
import { useAuthStore } from "../store/authStore";
import { authApi } from "../api/authApi";
import { documentApi } from "../api/documentApi";
import type { DocumentListResponse } from "../types";
import DocumentUploader from "../components/DocumentUploader";
import DocumentList from "../components/DocumentList";
import {
  DashboardLayout,
  NavBar,
  NavTitle,
  NavEmail,
  NavLogoutButton,
  MainContent,
  SectionTitle,
  NavHistoryButton,
  NavCollectionButton,
  NavActions,
} from "../components/styles/DocumentStyles";
import { DocumentListSkeleton } from "../components/skeletons/DocumentSkeleton";
import usePageTitle from "../hooks/usePageTitle";

const DashboardPage = () => {
  const navigate = useNavigate();
  usePageTitle("Dashboard");
  const { email, logout } = useAuthStore();
  const isAdmin = email === "aviguptavalc5083@gmail.com";
  const [documents, setDocuments] = useState<DocumentListResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const docs = await documentApi.getAll();
      setDocuments(docs);
    } catch (err) {
      toast.error("Failed to load documents.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  // Poll status every 5 seconds for processing documents
  useEffect(() => {
    const processing = documents.filter((d) => d.status === "processing");
    if (processing.length === 0) return;

    const interval = setInterval(async () => {
      const updated = await Promise.all(
        documents.map(async (doc) => {
          if (doc.status !== "processing") return doc;
          const status = await documentApi.getStatus(doc.id);
          return { ...doc, status: status.status };
        }),
      );
      setDocuments(updated);
    }, 5000);

    return () => clearInterval(interval);
  }, [documents]);

  const handleUploadSuccess = (doc: DocumentListResponse) => {
    setDocuments((prev) => [doc, ...prev]);
  };

  const handleDelete = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem("refreshToken") || "";
    await authApi.logout(refreshToken);
    logout();
    navigate("/login");
  };

  return (
    <DashboardLayout>
      {/* Nav Bar */}
      <NavBar>
        <NavTitle>🤖 DocQnA</NavTitle>
        <NavActions>
          <NavEmail>{email}</NavEmail>
          {isAdmin && (
            <NavCollectionButton
              variant="outlined"
              size="small"
              startIcon={<AdminPanelSettings />}
              onClick={() => navigate("/admin")}
              sx={{
                background: "rgba(0, 38, 253, 0.96)",
                borderColor: "rgba(255, 255, 255, 0.93)",
                "&:hover": {
                  background: "rgba(93, 103, 255, 0.3)",
                },
              }}
            >
              Admin
            </NavCollectionButton>
          )}
          <NavCollectionButton
            variant="outlined"
            startIcon={<TrendingUp />}
            onClick={() => navigate("/analytics")}
          >
            Analytics
          </NavCollectionButton>
          <NavCollectionButton
            variant="outlined"
            size="small"
            startIcon={<Folder />}
            onClick={() => navigate("/collections")}
          >
            Collections
          </NavCollectionButton>
          <NavHistoryButton
            variant="outlined"
            size="small"
            startIcon={<History />}
            onClick={() => navigate("/history")}
          >
            History
          </NavHistoryButton>
          <NavLogoutButton
            variant="outlined"
            size="small"
            onClick={handleLogout}
          >
            Logout
          </NavLogoutButton>
        </NavActions>
      </NavBar>

      {/* Main Content */}
      <MainContent>
        <SectionTitle sx={{ mb: 3, fontSize: "1.6rem" }}>
          📄 My Documents
        </SectionTitle>

        {/* Upload Section */}
        <DocumentUploader onUploadSuccess={handleUploadSuccess} />

        {/* Document List */}
        {loading ? (
          <DocumentListSkeleton />
        ) : (
          <DocumentList
            documents={documents}
            onDelete={handleDelete}
            onRefresh={fetchDocuments}
          />
        )}
      </MainContent>
    </DashboardLayout>
  );
};

export default DashboardPage;
