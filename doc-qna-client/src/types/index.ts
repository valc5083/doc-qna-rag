export interface IAuthResponse {
    accessToken: string;
    email: string;
    expiresAt : string;
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