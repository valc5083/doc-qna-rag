import axios from "axios";
import * as types from "../types";

const api = axios.create({
  baseURL: "https://localhost:7260/api",
});

// Attach JWT Token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  register: async (
    data: types.IRegisterRequest,
  ): Promise<types.IAuthResponse> => {
    const response = await api.post("/auth/register", data);
    return response.data;
  },

  login: async (data: types.ILoginRequest): Promise<types.IAuthResponse> => {
    const response = await api.post("/auth/login", data);
    console.log('Auth response:', response.data); // ← add this temporarily
    return response.data;
  },

  logout: async (refreshToken: string): Promise<void> => {
    await api.post("/auth/logout", JSON.stringify(refreshToken), {
      headers: { "Content-Type": "application/json" },
    });
  },
};

export default authApi;
