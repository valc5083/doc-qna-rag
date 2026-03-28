import { api } from "./authApi";
import type { DocumentUploadResponse, DocumentListResponse } from "../types";

export const documentApi = {
  upload: async (file: File): Promise<DocumentUploadResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post<DocumentUploadResponse>(
      "/document/upload",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return response.data;
  },

  getAll: async (): Promise<DocumentListResponse[]> => {
    const response = await api.get<DocumentListResponse[]>("/document");
    return response.data;
  },

  getStatus: async (id: string): Promise<{ id: string; status: string }> => {
    const response = await api.get(`/document/${id}/status`);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/document/${id}`);
  },
};
