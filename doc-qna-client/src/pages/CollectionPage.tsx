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
} from "@mui/icons-material";
import toast from "react-hot-toast";
import { collectionApi } from "../api/collectionApi";
import { documentApi } from "../api/documentApi";
import { useAuthStore } from "../store/authStore";
import { authApi } from "../api/authApi";
import type { CollectionResponse, DocumentListResponse } from "../types";
import {
  NavBar,
  NavTitle,
  NavEmail,
  NavLogoutButton,
  MainContent,
} from "../components/styles/DocumentStyles";
import {
  CollectionCard,
  CollectionCardHeader,
  CollectionName,
  CollectionDescription,
  CollectionBody,
  CollectionDocItem,
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

const CollectionsPage = () => {
  const navigate = useNavigate();
  usePageTitle('Collections');

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
          <IconButton
            onClick={() => navigate(-1)}
            sx={{ color: "#ffffff" }}
          >
            <ArrowBack />
          </IconButton>
          <NavTitle>🗂️ Collections</NavTitle>
        </Box>
        <Box display="flex" alignItems="center" gap={2}>
          <NavEmail>{email}</NavEmail>
          <NavLogoutButton variant="outlined" onClick={handleLogout}>
            Logout
          </NavLogoutButton>
        </Box>
      </NavBar>

      <MainContent>
        {/* Create Collection Form */}
        <CreateCollectionCard>
          <Typography fontWeight={700} fontSize="1.1rem" color="#1F4E79" mb={2}>
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
            <FolderOpen sx={{ color: "#1F4E79" }} />
            <Typography fontWeight={700} fontSize="1.2rem" color="#1F4E79">
              Your Collections ({collections.length})
            </Typography>
          </Box>
        </Box>

        {/* Loading */}
        {loading ? (
          <CollectionListSkeleton />
        ) : collections.length === 0 ? (
          <EmptyCollectionBox>
            <FolderOpen sx={{ fontSize: 64, mb: 2, opacity: 0.2 }} />
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
                <Box flex={1}>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <FolderOpen sx={{ color: "#ffffff" }} />
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
                </Box>

                <Box display="flex" alignItems="center" gap={1}>
                  <Tooltip title="Add document">
                    <IconButton
                      size="small"
                      sx={{ color: "#ffffff" }}
                      onClick={() => {
                        setSelectedCollectionId(col.id);
                        setAddDocDialog(true);
                      }}
                    >
                      <Add />
                    </IconButton>
                  </Tooltip>

                  <Tooltip
                    title={expandedId === col.id ? "Collapse" : "Expand"}
                  >
                    <IconButton
                      size="small"
                      sx={{ color: "#ffffff" }}
                      onClick={() =>
                        setExpandedId((prev) =>
                          prev === col.id ? null : col.id,
                        )
                      }
                    >
                      {expandedId === col.id ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                  </Tooltip>

                  <DeleteCollectionButton
                    disabled={deletingCollection}
                    variant="outlined"
                    size="small"
                    onClick={() => handleDelete(col.id, col.name)}
                    sx={{
                      borderColor: "rgba(255,255,255,0.5)",
                      color: "#ffffff",
                      "&:hover": {
                        background: "rgba(255,255,255,0.1)",
                        borderColor: "#ffffff",
                      },
                    }}
                  >
                    <Delete fontSize="small" />
                  </DeleteCollectionButton>
                </Box>
              </CollectionCardHeader>

              {/* Documents List */}
              <Collapse in={expandedId === col.id}>
                <CollectionBody>
                  {col.documents.length === 0 ? (
                    <EmptyCollectionBox sx={{ py: 2 }}>
                      <Typography fontSize="0.875rem">
                        No documents in this collection yet. Click + to add one.
                      </Typography>
                    </EmptyCollectionBox>
                  ) : (
                    col.documents.map((doc) => (
                      <CollectionDocItem key={doc.id}>
                        <Box display="flex" alignItems="center" gap={1.5}>
                          <PictureAsPdf
                            sx={{ color: "#e53935", fontSize: 28 }}
                          />
                          <Box>
                            <Typography fontWeight={600} fontSize="0.9rem">
                              {doc.originalFileName}
                            </Typography>
                            <Typography fontSize="0.75rem" color="#888888">
                              {formatSize(doc.fileSizeBytes)}
                              {doc.chunkCount > 0 &&
                                ` · ${doc.chunkCount} chunks`}
                            </Typography>
                          </Box>
                        </Box>

                        <Box display="flex" alignItems="center" gap={1}>
                          <Chip
                            label={doc.status}
                            size="small"
                            color={
                              doc.status === "ready" ? "success" : "warning"
                            }
                            sx={{ fontWeight: 600, borderRadius: 6 }}
                          />
                          <Tooltip title="Chat with this doc">
                            <IconButton
                              size="small"
                              sx={{ color: "#2E75B6" }}
                              onClick={() => navigate(`/chat/${doc.id}`)}
                            >
                              <Chat fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Remove from collection">
                            <IconButton
                              size="small"
                              sx={{ color: "#e53935" }}
                              onClick={() =>
                                handleRemoveDocument(
                                  col.id,
                                  doc.id,
                                  doc.originalFileName,
                                )
                              }
                            >
                              <RemoveCircleOutline fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
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
      <Dialog
        open={addDocDialog}
        onClose={() => setAddDocDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle fontWeight={700} color="#1F4E79">
          Add Document to Collection
        </DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel>Select Document</InputLabel>
            <Select
              value={selectedDocId}
              label="Select Document"
              onChange={(e) => setSelectedDocId(e.target.value)}
              sx={{ borderRadius: 2 }}
            >
              {documents.length === 0 ? (
                <MenuItem disabled>No ready documents available</MenuItem>
              ) : (
                documents.map((doc) => (
                  <MenuItem key={doc.id} value={doc.id}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <PictureAsPdf sx={{ color: "#e53935", fontSize: 20 }} />
                      {doc.originalFileName}
                    </Box>
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => setAddDocDialog(false)}
            sx={{ borderRadius: 2, textTransform: "none" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAddDocument}
            disabled={addingDoc || !selectedDocId}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 700,
              background: "linear-gradient(135deg, #1F4E79, #2E75B6)",
            }}
          >
            {addingDoc ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              "Add Document"
            )}
          </Button>
        </DialogActions>
      </Dialog>
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
