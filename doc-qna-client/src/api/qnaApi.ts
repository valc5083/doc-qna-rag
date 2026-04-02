import toast from "react-hot-toast";
import { api } from "./authApi";
import type {
  AskCollectionRequest,
  AskRequest,
  AskResponse,
  ChatHistoryItem,
  CollectionAskResponse,
  SourceChunk,
} from "../types";

export const qnaApi = {
  ask: async (data: AskRequest): Promise<AskResponse> => {
    const response = await api.post<AskResponse>("/qna/ask", data);
    return response.data;
  },

  // ── Streaming via EventSource ─────────────────────────────
  askStream: (
    question: string,
    documentId: string,
    token: string,
    onToken: (token: string) => void,
    onSources: (sources: SourceChunk[]) => void,
    onMetadata: (
      answerSource: "document" | "ai_fallback",
      fallbackReason?: string,
    ) => void,
    onStatus: (status: string) => void,
    onDone: () => void,
    onError: (error: string) => void,
  ): EventSource => {
    // ← Build SSE URL from env variable
    const baseUrl = (
      import.meta.env.VITE_API_BASE_URL || "https://localhost:7260/api"
    ).replace(/\/api$/, ""); // remove trailing /api

    const url =
      `${baseUrl}/api/qna/ask-stream` +
      `?question=${encodeURIComponent(question)}` +
      `&documentId=${encodeURIComponent(documentId)}` +
      `&access_token=${encodeURIComponent(token)}`;

    const eventSource = new EventSource(url);

    eventSource.addEventListener("metadata", (e) => {
      try {
        const metadata = JSON.parse((e as MessageEvent).data);
        onMetadata(metadata.answerSource, metadata.fallbackReason);
      } catch {}
    });

    eventSource.addEventListener("token", (e) => {
      const text = (e as MessageEvent).data
        .replace(/\\n/g, "\n")
        .replace(/\\\\/g, "\\");
      onToken(text);
    });

    eventSource.addEventListener("sources", (e) => {
      try {
        const sources = JSON.parse((e as MessageEvent).data);
        onSources(sources);
      } catch {}
    });

    eventSource.addEventListener("status", (e) => {
      onStatus((e as MessageEvent).data);
    });

    eventSource.addEventListener("done", () => {
      eventSource.close();
      onDone();
    });

    eventSource.addEventListener("error", (e) => {
      const msg = (e as MessageEvent).data || "Connection error";
      onError(msg);
      toast.error(msg);
      eventSource.close();
    });

    eventSource.onerror = () => {
      eventSource.close();
      onDone();
    };

    return eventSource;
  },

  askCollection: async (
    data: AskCollectionRequest,
  ): Promise<CollectionAskResponse> => {
    const res = await api.post<CollectionAskResponse>(
      "/qna/ask-collection",
      data,
    );
    return res.data;
  },

  getHistory: async (limit = 20): Promise<ChatHistoryItem[]> => {
    const response = await api.get<ChatHistoryItem[]>(
      `/qna/history?limit=${limit}`,
    );
    return response.data;
  },

  clearHistory: async (): Promise<void> => {
    await api.delete("/qna/history");
  },

  deleteOne: async (id: string): Promise<void> => {
    await api.delete(`/qna/history/${id}`);
  },
};
