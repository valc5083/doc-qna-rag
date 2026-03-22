import { create } from "zustand";

interface IAuthState {
  accessToken: string | null;
  email: string | null;
  isAuthenticated: boolean;
  login: (accessToken: string, email: string, refreshToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<IAuthState>((set) => ({
  accessToken: localStorage.getItem("accessToken"),
  email: localStorage.getItem("email"),
  isAuthenticated: !!localStorage.getItem("accessToken"),

  login: (accessToken, refreshToken, email) => {
    localStorage.clear();
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    localStorage.setItem("email", email);
    // DEBUG
    console.log("Stored in localStorage:", {
      accessToken: localStorage.getItem("accessToken")?.substring(0, 20),
      refreshToken: localStorage.getItem("refreshToken"),
      email: localStorage.getItem("email"),
    });
    set({ accessToken, email, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("email");
    localStorage.removeItem("refreshToken");
    set({ accessToken: null, email: null, isAuthenticated: false });
  },
}));

export default useAuthStore;
