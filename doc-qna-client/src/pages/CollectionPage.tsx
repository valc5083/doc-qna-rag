import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  CircularProgress,
  Collapse,
  IconButton,
  Tooltip,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  TextField,
} from "@mui/material";
import {
  Add,
  Delete,
  ExpandMore,
  ExpandLess,
  FolderOpen,
  PictureAsPdf,
  ArrowBack,
  Chat,
  RemoveCircleOutline,
  QuestionAnswer,
} from "@mui/icons-material";
import toast from "react-hot-toast";
import { collectionApi } from "../api/collectionApi";
import { documentApi } from "../api/documentApi";
import { useAuthStore } from "../store/authStore";
import { authApi } from "../api/authApi";
import type {
  CollectionAskResponse,
  CollectionResponse,
  DocumentListResponse,
} from "../types";
import {
  NavBar,
  NavTitle,
  NavEmail,
  NavLogoutButton,
  NavActions,
  MainContent,
} from "../components/styles/DocumentStyles";
import {
  CollectionCard,
  CollectionCardHeader,
  CollectionHeaderInfo,
  CollectionHeaderActions,
  CollectionName,
  CollectionDescription,
  CollectionBody,
  CollectionDocItem,
  CollectionDocInfo,
  CollectionDocTitle,
  CollectionDocActions,
  CreateCollectionCard,
  CollectionInput,
  CreateButton,
  DeleteCollectionButton,
  EmptyCollectionBox,
  DocCountBadge,
} from "../components/styles/CollectionStyles";
import { HistoryLayout } from "../components/styles/HistoryStyles";
import ConfirmationDialog from "../components/ConfirmationDialog";
import { CollectionListSkeleton } from "../components/skeletons/CollectionSkeleton";
import usePageTitle from "../hooks/usePageTitle";
import { qnaApi } from "../api/qnaApi";
import ReactMarkdown from "react-markdown";
import DarkModeToggle from "../components/DarkModeToggle";
import { styled } from "@mui/material/styles";

const BackIconButton = styled(IconButton)({
  color: "#ffffff",
});

const HeaderFolderIcon = styled(FolderOpen)(({ theme }) => ({
  color: theme.palette.text.primary,
}));

const EmptyFolderIcon = styled(FolderOpen)({
  fontSize: 64,
  marginBottom: 16,
  opacity: 0.2,
});

const CollectionFolderIcon = styled(FolderOpen)({
  color: "#ffffff",
});

const HeaderActionIconButton = styled(IconButton)({
  color: "#ffffff",
});

const StyledDeleteCollectionButton = styled(DeleteCollectionButton)({
  borderColor: "rgba(255,255,255,0.5)",
  color: "#ffffff",
  "&:hover": {
    background: "rgba(255,255,255,0.1)",
    borderColor: "#ffffff",
  },
});

const AskPanel = styled(Box)(({ theme }) => ({
  background: theme.palette.mode === "dark" ? "#121926" : "#F5F8FB",
  borderBottom: `1px solid ${theme.palette.divider}`,
  padding: 16,
}));

const RoundedQuestionField = styled(TextField)({
  "& .MuiOutlinedInput-root": {
    borderRadius: 8,
  },
});

const AskButton = styled(Button)({
  borderRadius: 8,
  textTransform: "none",
  fontWeight: 700,
  background: "linear-gradient(135deg, #1F4E79, #2E75B6)",
  minWidth: 80,
});

const AskAnswerBox = styled(Box)(({ theme }) => ({
  background: theme.palette.background.paper,
  borderRadius: 8,
  padding: 16,
  border: `1px solid ${theme.palette.divider}`,
  fontSize: "0.9rem",
  lineHeight: 1.6,
  color: theme.palette.text.primary,
}));

const SourceSnippetBox = styled(Box)(({ theme }) => ({
  background: theme.palette.mode === "dark" ? "#1E293B" : "#EBF3FB",
  borderRadius: 8,
  padding: 12,
  marginBottom: 8,
  fontSize: "0.78rem",
  color: theme.palette.text.primary,
}));

const EmptyCollectionContent = styled(EmptyCollectionBox)({
  paddingTop: 16,
  paddingBottom: 16,
});

const DocumentPdfIcon = styled(PictureAsPdf)({
  color: "#e53935",
  fontSize: 28,
});

const StatusChip = styled(Chip)({
  fontWeight: 600,
  borderRadius: 6,
});

const ChatIconButton = styled(IconButton)({
  color: "#2E75B6",
});

const RemoveIconButton = styled(IconButton)({
  color: "#e53935",
});

const AddDocumentDialog = styled(Dialog)({
  "& .MuiPaper-root": {
    borderRadius: 12,
  },
});

const AddDocumentFormControl = styled(FormControl)({
  marginTop: 8,
});

const AddDocumentSelect = styled(Select)({
  borderRadius: 8,
});

const DialogPdfIcon = styled(PictureAsPdf)({
  color: "#e53935",
  fontSize: 20,
});

const AddDocumentActions = styled(DialogActions)({
  padding: 16,
  gap: 8,
});

const CancelActionButton = styled(Button)({
  borderRadius: 8,
  textTransform: "none",
});

const ConfirmAddButton = styled(Button)({
  borderRadius: 8,
  textTransform: "none",
  fontWeight: 700,
  background: "linear-gradient(135deg, #1F4E79, #2E75B6)",
});

const CollectionsPage = () => {
  const navigate = useNavigate();
  usePageTitle("Collections");

  const { email, logout } = useAuthStore();
  const [collections, setCollections] = useState<CollectionResponse[]>([]);
  const [documents, setDocuments] = useState<DocumentListResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Create form
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);

  // Add document dialog
  const [addDocDialog, setAddDocDialog] = useState(false);
  const [selectedCollectionId, setSelectedCollectionId] = useState("");
  const [selectedDocId, setSelectedDocId] = useState("");
  const [addingDoc, setAddingDoc] = useState(false);

  // Delete Collection
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState("");
  const [deletingCollection, setDeletingCollection] = useState(false);

  const [askingCollectionId, setAskingCollectionId] = useState<string | null>(
    null,
  );
  const [collectionQuestion, setCollectionQuestion] = useState("");
  const [collectionAnswer, setCollectionAnswer] =
    useState<CollectionAskResponse | null>(null);
  const [askingLoading, setAskingLoading] = useState(false);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [cols, docs] = await Promise.all([
        collectionApi.getAll(),
        documentApi.getAll(),
      ]);
      setCollections(cols);
      setDocuments(docs.filter((d) => d.status === "ready"));
    } catch {
      toast.error("Failed to load collections.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleCreate = async () => {
    if (!newName.trim()) {
      toast.error("Collection name is required.");
      return;
    }
    try {
      setCreating(true);
      const col = await collectionApi.create({
        name: newName.trim(),
        description: newDesc.trim(),
      });
      setCollections((prev) => [col, ...prev]);
      setNewName("");
      setNewDesc("");
      toast.success(`Collection "${col.name}" created!`);
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || "Failed to create collection.",
      );
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = (id: string, name: string) => {
    setDeleteId(id);
    setDeleteName(name);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      setDeletingCollection(true);
      await collectionApi.delete(deleteId);
      setCollections((prev) => prev.filter((c) => c.id !== deleteId));
      toast.success(`Collection "${deleteName}" deleted.`);
    } catch {
      toast.error("Failed to delete collection.");
    } finally {
      setDeletingCollection(false);
      setShowDeleteConfirm(false);
      setDeleteId(null);
      setDeleteName("");
    }
  };

  const handleAddDocument = async () => {
    if (!selectedDocId) {
      toast.error("Please select a document.");
      return;
    }
    try {
      setAddingDoc(true);
      await collectionApi.addDocument(selectedCollectionId, selectedDocId);
      await fetchAll();
      setAddDocDialog(false);
      setSelectedDocId("");
      toast.success("Document added to collection!");
    } catch {
      toast.error("Failed to add document.");
    } finally {
      setAddingDoc(false);
    }
  };

  const handleRemoveDocument = async (
    collectionId: string,
    documentId: string,
    docName: string,
  ) => {
    try {
      await collectionApi.removeDocument(collectionId, documentId);
      setCollections((prev) =>
        prev.map((c) =>
          c.id === collectionId
            ? {
                ...c,
                documents: c.documents.filter((d) => d.id !== documentId),
                documentCount: c.documentCount - 1,
              }
            : c,
        ),
      );
      toast.success(`"${docName}" removed from collection.`);
    } catch {
      toast.error("Failed to remove document.");
    }
  };

  const handleAskCollection = async (collectionId: string) => {
    if (!collectionQuestion.trim()) {
      toast.error("Enter a question first.");
      return;
    }
    try {
      setAskingLoading(true);
      const result = await qnaApi.askCollection({
        question: collectionQuestion,
        collectionId,
      });
      setCollectionAnswer(result);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to get answer.");
    } finally {
      setAskingLoading(false);
    }
  };

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem("refreshToken") || "";
    await authApi.logout(refreshToken);
    logout();
    navigate("/login");
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <HistoryLayout>
      {/* NavBar */}
      <NavBar>
        <Box display="flex" alignItems="center" gap={2}>
          <BackIconButton onClick={() => navigate(-1)}>
            <ArrowBack />
          </BackIconButton>
          <NavTitle>🗂️ Collections</NavTitle>
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
        {/* Create Collection Form */}
        <CreateCollectionCard>
          <Typography
            fontWeight={700}
            fontSize="1.1rem"
            color="text.primary"
            mb={2}
          >
            ➕ Create New Collection
          </Typography>
          <CollectionInput
            fullWidth
            label="Collection Name"
            placeholder="e.g. Legal Documents, Research Papers"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
          <CollectionInput
            fullWidth
            label="Description (optional)"
            placeholder="What documents does this collection contain?"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
          />
          <CreateButton
            onClick={handleCreate}
            disabled={creating}
            startIcon={
              creating ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <Add />
              )
            }
          >
            Create Collection
          </CreateButton>
        </CreateCollectionCard>

        {/* Header */}
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          mb={2}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <HeaderFolderIcon />
            <Typography fontWeight={700} fontSize="1.2rem" color="text.primary">
              Your Collections ({collections.length})
            </Typography>
          </Box>
        </Box>

        {/* Loading */}
        {loading ? (
          <CollectionListSkeleton />
        ) : collections.length === 0 ? (
          <EmptyCollectionBox>
            <EmptyFolderIcon />
            <Typography fontSize="1.1rem" mb={1}>
              No collections yet
            </Typography>
            <Typography fontSize="0.875rem">
              Create a collection to group your documents!
            </Typography>
          </EmptyCollectionBox>
        ) : (
          collections.map((col) => (
            <CollectionCard key={col.id}>
              {/* Card Header */}
              <CollectionCardHeader>
                <CollectionHeaderInfo>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <CollectionFolderIcon />
                    <CollectionName>{col.name}</CollectionName>
                    <DocCountBadge>
                      {col.documentCount} doc
                      {col.documentCount !== 1 ? "s" : ""}
                    </DocCountBadge>
                  </Box>
                  {col.description && (
                    <CollectionDescription>
                      {col.description}
                    </CollectionDescription>
                  )}
                </CollectionHeaderInfo>

                <CollectionHeaderActions>
                  <Tooltip title="Add document">
                    <HeaderActionIconButton
                      size="small"
                      onClick={() => {
                        setSelectedCollectionId(col.id);
                        setAddDocDialog(true);
                      }}
                    >
                      <Add />
                    </HeaderActionIconButton>
                  </Tooltip>

                  <Tooltip
                    title={expandedId === col.id ? "Collapse" : "Expand"}
                  >
                    <HeaderActionIconButton
                      size="small"
                      onClick={() =>
                        setExpandedId((prev) =>
                          prev === col.id ? null : col.id,
                        )
                      }
                    >
                      {expandedId === col.id ? <ExpandLess /> : <ExpandMore />}
                    </HeaderActionIconButton>
                  </Tooltip>
                  <Tooltip title="Ask a question across all docs">
                    <HeaderActionIconButton
                      size="small"
                      onClick={() =>
                        setAskingCollectionId(
                          askingCollectionId === col.id ? null : col.id,
                        )
                      }
                    >
                      <QuestionAnswer />
                    </HeaderActionIconButton>
                  </Tooltip>
                  <StyledDeleteCollectionButton
                    disabled={deletingCollection}
                    variant="outlined"
                    size="small"
                    onClick={() => handleDelete(col.id, col.name)}
                  >
                    <Delete fontSize="small" />
                  </StyledDeleteCollectionButton>
                </CollectionHeaderActions>
              </CollectionCardHeader>

              {/* Q&A Panel */}
              {expandedId === col.id && askingCollectionId === col.id && (
                <AskPanel>
                  <Typography
                    fontWeight={600}
                    fontSize="0.9rem"
                    color="text.primary"
                    mb={1.5}
                  >
                    🔍 Ask across all {col.documentCount} document(s)
                  </Typography>

                  <Box display="flex" gap={1}>
                    <RoundedQuestionField
                      fullWidth
                      size="small"
                      placeholder="Ask anything about this collection..."
                      value={collectionQuestion}
                      onChange={(e) => setCollectionQuestion(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAskCollection(col.id);
                      }}
                    />
                    <AskButton
                      variant="contained"
                      onClick={() => handleAskCollection(col.id)}
                      disabled={askingLoading || !collectionQuestion.trim()}
                    >
                      {askingLoading ? (
                        <CircularProgress size={18} color="inherit" />
                      ) : (
                        "Ask"
                      )}
                    </AskButton>
                  </Box>

                  {collectionAnswer && (
                    <Box mt={2}>
                      <Typography fontSize="0.8rem" color="#888888" mb={1}>
                        Searched {collectionAnswer.documentsSearched}{" "}
                        document(s) · {collectionAnswer.sources.length} sources
                        found
                      </Typography>
                      <AskAnswerBox>
                        <ReactMarkdown>{collectionAnswer.answer}</ReactMarkdown>
                      </AskAnswerBox>

                      {collectionAnswer.sources.length > 0 && (
                        <Box mt={1.5}>
                          {collectionAnswer.sources.map((s, i) => (
                            <SourceSnippetBox key={i}>
                              <Typography
                                fontSize="0.75rem"
                                fontWeight={700}
                                color="text.primary"
                                mb={0.5}
                              >
                                📄 {s.documentName} — Chunk #{s.chunkIndex}
                                <span
                                  style={{
                                    color: "#2E75B6",
                                    marginLeft: 8,
                                  }}
                                >
                                  {(s.score * 100).toFixed(0)}% relevant
                                </span>
                              </Typography>
                              {s.text.length > 150
                                ? s.text.substring(0, 150) + "..."
                                : s.text}
                            </SourceSnippetBox>
                          ))}
                        </Box>
                      )}
                    </Box>
                  )}
                </AskPanel>
              )}
              {/* Documents List */}
              <Collapse in={expandedId === col.id}>
                <CollectionBody>
                  {col.documents.length === 0 ? (
                    <EmptyCollectionContent>
                      <Typography fontSize="0.875rem">
                        No documents in this collection yet. Click + to add one.
                      </Typography>
                    </EmptyCollectionContent>
                  ) : (
                    col.documents.map((doc) => (
                      <CollectionDocItem key={doc.id}>
                        <CollectionDocInfo>
                          <DocumentPdfIcon />
                          <Box minWidth={0}>
                            <CollectionDocTitle>
                              {doc.originalFileName}
                            </CollectionDocTitle>
                            <Typography fontSize="0.75rem" color="#888888">
                              {formatSize(doc.fileSizeBytes)}
                              {doc.chunkCount > 0 &&
                                ` · ${doc.chunkCount} chunks`}
                            </Typography>
                          </Box>
                        </CollectionDocInfo>

                        <CollectionDocActions>
                          <StatusChip
                            label={doc.status}
                            size="small"
                            color={
                              doc.status === "ready" ? "success" : "warning"
                            }
                          />
                          <Tooltip title="Chat with this doc">
                            <ChatIconButton
                              size="small"
                              onClick={() => navigate(`/chat/${doc.id}`)}
                            >
                              <Chat fontSize="small" />
                            </ChatIconButton>
                          </Tooltip>
                          <Tooltip title="Remove from collection">
                            <RemoveIconButton
                              size="small"
                              onClick={() =>
                                handleRemoveDocument(
                                  col.id,
                                  doc.id,
                                  doc.originalFileName,
                                )
                              }
                            >
                              <RemoveCircleOutline fontSize="small" />
                            </RemoveIconButton>
                          </Tooltip>
                        </CollectionDocActions>
                      </CollectionDocItem>
                    ))
                  )}
                </CollectionBody>
              </Collapse>
            </CollectionCard>
          ))
        )}
      </MainContent>

      {/* Add Document Dialog */}
      <AddDocumentDialog
        open={addDocDialog}
        onClose={() => setAddDocDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle fontWeight={700} color="text.primary">
          Add Document to Collection
        </DialogTitle>
        <DialogContent>
          <AddDocumentFormControl fullWidth>
            <InputLabel>Select Document</InputLabel>
            <AddDocumentSelect
              value={selectedDocId}
              label="Select Document"
              onChange={(e) => setSelectedDocId(e.target.value)}
            >
              {documents.length === 0 ? (
                <MenuItem disabled>No ready documents available</MenuItem>
              ) : (
                documents.map((doc) => (
                  <MenuItem key={doc.id} value={doc.id}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <DialogPdfIcon />
                      {doc.originalFileName}
                    </Box>
                  </MenuItem>
                ))
              )}
            </AddDocumentSelect>
          </AddDocumentFormControl>
        </DialogContent>
        <AddDocumentActions>
          <CancelActionButton onClick={() => setAddDocDialog(false)}>
            Cancel
          </CancelActionButton>
          <ConfirmAddButton
            variant="contained"
            onClick={handleAddDocument}
            disabled={addingDoc || !selectedDocId}
          >
            {addingDoc ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              "Add Document"
            )}
          </ConfirmAddButton>
        </AddDocumentActions>
      </AddDocumentDialog>
      <ConfirmationDialog
        open={showDeleteConfirm}
        type="confirm"
        title="Delete Collection"
        message={`Are you sure you want to delete "${deleteName}"?\n\nNote: Documents inside will NOT be deleted.`}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        confirmText="Delete"
        closeText="Cancel"
      />
    </HistoryLayout>
  );
};

export default CollectionsPage;
