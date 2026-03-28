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
