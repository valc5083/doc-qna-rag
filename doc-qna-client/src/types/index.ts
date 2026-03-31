export interface IAuthResponse {
  accessToken: string;
  email: string;
  expiresAt: string;
  refreshToken: string;
}

export interface ILoginRequest {
  email: string;
  password: string;
}

export interface IRegisterRequest {
  email: string;
  password: string;
}

export interface DocumentUploadResponse {
  createdAt: string;
  fileSizeBytes: number;
  id: string;
  originalFileName: string;
  status: string;
}

export interface DocumentListResponse {
  chunkCount: number;
  createdAt: string;
  fileSizeBytes: number;
  id: string;
  originalFileName: string;
  status: string;
}

export interface SourceChunk {
  chunkIndex: number;
  score: number;
  text: string;
}

export interface AskRequest {
  documentId: string;
  question: string;
}

export interface AskResponse {
  answer: string;
  createdAt: string;
  question: string;
  sources: SourceChunk[];
  answerSource: 'document' | 'ai_fallback';
  fallbackReason?: string;
}

export interface ChatHistoryItem {
  answer: string;
  createdAt: string;
  documentId: string | null;
  documentName: string | null;
  id: string;
  question: string;
  sources: SourceChunk[];
  answerSource: 'document' | 'ai_fallback';
  fallbackReason?: string;
}

export interface ChatBubble {
  content: string;
  createdAt: string;
  id: string;
  sources?: SourceChunk[];
  type: "user" | "assistant";
  answerSource?: 'document' | 'ai_fallback';
  fallbackReason?: string;
}

export interface CollectionDocumentResponse {
  addedAt: string;
  chunkCount: number;
  fileSizeBytes: number;
  id: string;
  originalFileName: string;
  status: string;
}

export interface CollectionResponse {
  createdAt: string;
  description: string;
  documentCount: number;
  documents: CollectionDocumentResponse[];
  id: string;
  name: string;
}

export interface CreateCollectionRequest {
  description: string;
  name: string;
}

export interface AdminStats {
  failedDocuments: number;
  processingDocuments: number;
  readyDocuments: number;
  serverTime: string;
  totalCollections: number;
  totalConversations: number;
  totalDocuments: number;
  totalStorageBytes: number;
  totalUsers: number;
}

export interface AdminUser {
  collectionCount: number;
  conversationCount: number;
  createdAt: string;
  documentCount: number;
  email: string;
  id: string;
  lastActive: string | null;
  totalStorageBytes: number;
}

export interface AdminDocument {
  chunkCount: number;
  createdAt: string;
  fileSizeBytes: number;
  id: string;
  originalFileName: string;
  status: string;
  userEmail: string;
  userId: string;
}

export interface AdminConversation {
  answer: string;
  createdAt: string;
  documentName: string | null;
  id: string;
  question: string;
  sourceCount: number;
  userEmail: string;
}
