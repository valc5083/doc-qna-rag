import { api } from "./authApi";
import type {
  AdminStats,
  AdminUser,
  AdminDocument,
  AdminConversation,
} from "../types";

export const adminApi = {
  getStats: async (): Promise<AdminStats> => {
    const res = await api.get<AdminStats>("/admin/stats");
    return res.data;
  },

  getUsers: async (): Promise<AdminUser[]> => {
    const res = await api.get<AdminUser[]>("/admin/users");
    return res.data;
  },

  deleteUser: async (userId: string): Promise<void> => {
    await api.delete(`/admin/users/${userId}`);
  },

  getDocuments: async (): Promise<AdminDocument[]> => {
    const res = await api.get<AdminDocument[]>("/admin/documents");
    return res.data;
  },

  deleteDocument: async (documentId: string): Promise<void> => {
    await api.delete(`/admin/documents/${documentId}`);
  },

  getConversations: async (limit = 50): Promise<AdminConversation[]> => {
    const res = await api.get<AdminConversation[]>(
      `/admin/conversations?limit=${limit}`,
    );
    return res.data;
  },
};
