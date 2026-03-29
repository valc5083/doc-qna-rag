import toast from "react-hot-toast";
import axios from "axios";
import * as types from "../types";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://localhost:7260/api',
});

// Attach JWT Token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response Interceptor — handle 401 ────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem("refreshToken");

      if (refreshToken) {
        try {
          // Try to refresh the token
          const response = await axios.post(
            "https://localhost:7260/api/auth/refresh",
            JSON.stringify(refreshToken),
            { headers: { "Content-Type": "application/json" } },
          );

          const { accessToken, refreshToken: newRefreshToken } = response.data;

          localStorage.setItem("accessToken", accessToken);
          localStorage.setItem("refreshToken", newRefreshToken);

          // Retry the original request
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch {
          // Refresh failed — logout
          localStorage.clear();
          toast.error("Session expired. Please login again.");
          window.location.href = "/login";
          return Promise.reject(error);
        }
      } else {
        // No refresh token — redirect to login
        localStorage.clear();
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  },
);

export { api };

export const authApi = {
  register: async (
    data: types.IRegisterRequest,
  ): Promise<types.IAuthResponse> => {
    const response = await api.post("/auth/register", data);
    return response.data;
  },

  login: async (data: types.ILoginRequest): Promise<types.IAuthResponse> => {
    const response = await api.post("/auth/login", data);
    return response.data;
  },

  logout: async (refreshToken: string): Promise<void> => {
    await api.post("/auth/logout", JSON.stringify(refreshToken), {
      headers: { "Content-Type": "application/json" },
    });
  },
};

export default authApi;
