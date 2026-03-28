import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Tooltip,
} from "@mui/material";
import { Delete, PictureAsPdf, Refresh, Chat } from "@mui/icons-material";
import { documentApi } from "../api/documentApi";
import type { DocumentListResponse } from "../types";
import {
  DocumentCard,
  DocumentInfo,
  DocumentName,
  DocumentMeta,
  DeleteButton,
  EmptyStateBox,
  SectionTitle,
} from "./styles/DocumentStyles";
import ConfirmationDialog from "./ConfirmationDialog";

interface Props {
  documents: DocumentListResponse[];
  onDelete: (id: string) => void;
  onRefresh: () => void;
}

const statusColor = (status: string) => {
  switch (status) {
    case "ready":
      return "success";
    case "processing":
      return "warning";
    case "failed":
      return "error";
    default:
      return "default";
  }
};

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const DocumentList = ({ documents, onDelete, onRefresh }: Props) => {
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const navigate = useNavigate();

  const handleDelete = async (id: string, name: string) => {
    setDeleteId(id);
    setDeleteName(name);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      setDeleting(deleteId);
      await documentApi.delete(deleteId);
      onDelete(deleteId);
      setShowDeleteConfirm(false);
      setDeleteId(null);
      setDeleteName("");
    } catch {
      setDeleteError("Delete failed. Please try again.");
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        mb={2}
      >
        <SectionTitle>Your Documents</SectionTitle>
        <Tooltip title="Refresh list">
          <IconButton onClick={onRefresh} size="small">
            <Refresh sx={{ color: "#2E75B6" }} />
          </IconButton>
        </Tooltip>
      </Box>

      {documents.length === 0 ? (
        <EmptyStateBox>
          <PictureAsPdf sx={{ fontSize: 48, mb: 1, opacity: 0.3 }} />
          <DocumentMeta>No documents yet — upload your first PDF!</DocumentMeta>
        </EmptyStateBox>
      ) : (
        documents.map((doc) => (
          <DocumentCard key={doc.id}>
            <DocumentInfo>
              <PictureAsPdf sx={{ color: "#e53935", fontSize: 32 }} />
              <Box>
                <DocumentName>{doc.originalFileName}</DocumentName>
                <DocumentMeta>
                  {formatSize(doc.fileSizeBytes)}
                  {doc.chunkCount > 0 && ` · ${doc.chunkCount} chunks`}
                  {" · "}
                  {new Date(doc.createdAt).toLocaleDateString("en-IN")}
                </DocumentMeta>
              </Box>
            </DocumentInfo>

            <Box display="flex" alignItems="center" gap={1}>
              <Chip
                label={doc.status}
                color={statusColor(doc.status) as any}
                size="small"
                sx={{ fontWeight: 600, borderRadius: 6 }}
              />
              {doc.status === "ready" && (
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<Chat />}
                  onClick={() => navigate(`/chat/${doc.id}`)}
                  sx={{
                    borderRadius: 8,
                    textTransform: "none",
                    fontWeight: 600,
                    fontSize: "0.8rem",
                    background: "linear-gradient(135deg, #1F4E79, #2E75B6)",
                    "&:hover": {
                      background: "linear-gradient(135deg, #163d61, #1F4E79)",
                    },
                  }}
                >
                  Chat
                </Button>
              )}
              <DeleteButton
                variant="outlined"
                size="small"
                onClick={() => handleDelete(doc.id, doc.originalFileName)}
                disabled={deleting === doc.id}
              >
                {deleting === doc.id ? (
                  <CircularProgress size={14} />
                ) : (
                  <Delete fontSize="small" />
                )}
              </DeleteButton>
            </Box>
          </DocumentCard>
        ))
      )}

      <ConfirmationDialog
        open={showDeleteConfirm}
        type="confirm"
        title="Confirm Delete"
        message={`Are you sure you want to delete "${deleteName}"?\n\nNote: This action cannot be undone.`}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        confirmText="Delete"
        closeText="Cancel"
      />

      <ConfirmationDialog
        open={!!deleteError}
        type="error"
        title="Delete Error"
        message={deleteError}
        onClose={() => setDeleteError("")}
      />
    </div>
  );
};

export default DocumentList;
