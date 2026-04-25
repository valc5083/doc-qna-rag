import { api } from "./authApi";
import axios from "axios";
import type {
  CreateShareRequest,
  ShareResponse,
  SharedChatResponse,
} from "../types";

const baseUrl =
  import.meta.env.VITE_API_BASE_URL || "https://localhost:7260/api";

export const shareApi = {
  create: async (data: CreateShareRequest): Promise<ShareResponse> => {
    const res = await api.post<ShareResponse>("/share", data);
    return res.data;
  },

  // Public — no auth needed
  getShared: async (token: string): Promise<SharedChatResponse> => {
    const res = await axios.get<SharedChatResponse>(
      `${baseUrl}/share/${token}`,
    );
    return res.data;
  },

  getMyShares: async (): Promise<ShareResponse[]> => {
    const res = await api.get<ShareResponse[]>("/share/my");
    return res.data;
  },

  delete: async (token: string): Promise<void> => {
    await api.delete(`/share/${token}`);
  },
};
