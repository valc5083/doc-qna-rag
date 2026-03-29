import { useCallback } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import toast from "react-hot-toast";
import { CircularProgress } from "@mui/material";
import { CloudUpload } from "@mui/icons-material";
import { documentApi } from "../api/documentApi";
import type { DocumentListResponse } from "../types";
import {
  DropZoneBox,
  DropZoneIcon,
  DropZoneText,
  DropZoneSubText,
  UploadProgressBar,
} from "./styles/DocumentStyles";
import { useState } from "react";

interface Props {
  onUploadSuccess: (doc: DocumentListResponse) => void;
}

const DocumentUploader = ({ onUploadSuccess }: Props) => {
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      if (file.size > 50 * 1024 * 1024) {
        toast.error("File size must be under 50MB.");
        return;
      }

      try {
        setUploading(true);
        const response = await documentApi.upload(file);
        const doc: DocumentListResponse = {
          id: response.id,
          originalFileName: response.originalFileName,
          status: response.status,
          chunkCount: 0,
          fileSizeBytes: response.fileSizeBytes,
          createdAt: response.createdAt,
        };
        toast.success(`"${file.name}" uploaded! Processing in background...`);
        onUploadSuccess(doc);
      } catch (err: any) {
        toast.error(
          err.response?.data?.message || "Upload failed. Please try again.",
        );
      } finally {
        setUploading(false);
      }
    },
    [onUploadSuccess],
  );

  // ← This fires when a non-PDF is dropped or selected
  const onDropRejected = useCallback((fileRejections: FileRejection[]) => {
    const rejection = fileRejections[0];
    if (!rejection) return;

    const error = rejection.errors[0];
    if (error?.code === "file-invalid-type") {
      toast.error(
        `"${rejection.file.name}" is not a PDF. Only PDF files are supported.`,
      );
    } else if (error?.code === "file-too-large") {
      toast.error("File size must be under 50MB.");
    } else {
      toast.error("Invalid file. Please upload a PDF.");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected, // ← add this
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
    disabled: uploading,
    maxSize: 50 * 1024 * 1024,
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
            <DropZoneSubText>
              or click to browse — Max 50MB, PDF only
            </DropZoneSubText>
          </>
        )}
      </DropZoneBox>
    </div>
  );
};

export default DocumentUploader;
