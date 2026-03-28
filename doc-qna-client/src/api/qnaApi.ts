import { api } from "./authApi";
import type {
  AskRequest,
  AskResponse,
  ChatHistoryItem,
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
    onStatus: (status: string) => void,
    onDone: () => void,
    onError: (error: string) => void,
  ): EventSource => {
    const url =
      `https://localhost:7260/api/qna/ask-stream` +
      `?question=${encodeURIComponent(question)}` +
      `&documentId=${encodeURIComponent(documentId)}` +
      `&access_token=${encodeURIComponent(token)}`;

    const eventSource = new EventSource(url);

    eventSource.addEventListener("sources", (e) => {
      try {
        const raw = (e as MessageEvent).data;
        console.log("RAW SOURCES DATA:", raw); // ← add this
        const sources = JSON.parse(raw);
        console.log("PARSED SOURCES:", sources); // ← add this
        onSources(sources);
      } catch (err) {
        console.error("Sources parse error:", err, (e as MessageEvent).data);
      }
    });

    eventSource.addEventListener("token", (e) => {
      const text = (e as MessageEvent).data
        .replace(/\\n/g, "\n")
        .replace(/\\\\/g, "\\");
      onToken(text);
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
      eventSource.close();
    });

    eventSource.onerror = () => {
      eventSource.close();
      onDone();
    };

    return eventSource;
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
};
