import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { CircularProgress } from "@mui/material";
import { CloudUpload } from "@mui/icons-material";
import { documentApi } from "../api/documentApi";
import type { DocumentListResponse } from "../types";
import ConfirmationDialog from "./ConfirmationDialog";
import {
  DropZoneBox,
  DropZoneIcon,
  DropZoneText,
  DropZoneSubText,
  UploadProgressBar,
} from "./styles/DocumentStyles";

interface Props {
  onUploadSuccess: (doc: DocumentListResponse) => void;
}

const DocumentUploader = ({ onUploadSuccess }: Props) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showDialog, setShowDialog] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      // Validate
      if (!file.name.endsWith(".pdf")) {
        setError("Only PDF files are supported.");
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        setError("File size must be under 50MB.");
        return;
      }

      try {
        setUploading(true);
        setError("");
        setSuccess("");

        const response = await documentApi.upload(file);

        // Convert upload response to list response shape
        const doc: DocumentListResponse = {
          id: response.id,
          originalFileName: response.originalFileName,
          status: response.status,
          chunkCount: 0,
          fileSizeBytes: response.fileSizeBytes,
          createdAt: response.createdAt,
        };

        setSuccess(`"${file.name}" uploaded! Processing in background...`);
        setShowDialog(true);
        onUploadSuccess(doc);
      } catch (err: any) {
        setError(
          err.response?.data?.message || "Upload failed. Please try again.",
        );
      } finally {
        setUploading(false);
      }
    },
    [onUploadSuccess],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
    disabled: uploading,
  });

  return (
    <div>
      <DropZoneBox {...getRootProps()} isDragActive={isDragActive}>
        <input {...getInputProps()} />
        <DropZoneIcon>
          {uploading ? (
            <CircularProgress size={40} />
          ) : (
            <CloudUpload sx={{ fontSize: 48, color: "#2E75B6" }} />
          )}
        </DropZoneIcon>

        {uploading ? (
          <>
            <DropZoneText>Uploading...</DropZoneText>
            <UploadProgressBar />
          </>
        ) : isDragActive ? (
          <DropZoneText>Drop your PDF here!</DropZoneText>
        ) : (
          <>
            <DropZoneText>Drag & drop a PDF here</DropZoneText>
            <DropZoneSubText>or click to browse — Max 50MB</DropZoneSubText>
          </>
        )}
      </DropZoneBox>

      <ConfirmationDialog
        open={showDialog}
        type="confirm"
        title="Upload Successful"
        message={success}
        onClose={() => setShowDialog(false)}
      />

      <ConfirmationDialog
        open={!!error}
        type="error"
        title="Upload Error"
        message={error}
        onClose={() => setError("")}
      />
    </div>
  );
};

export default DocumentUploader;
