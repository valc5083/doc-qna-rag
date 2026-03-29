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
    set({ accessToken, email, isAuthenticated: true });
  },
  logout: () => {
    // Clear all localStorage
    localStorage.clear();
    // Clear all sessionStorage
    sessionStorage.clear();
    // Unregister service workers if any
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => registration.unregister());
      });
    }
    set({ accessToken: null, email: null, isAuthenticated: false });
    // Force hard refresh
    setTimeout(() => {
      window.location.href = '/login';
    }, 100);
  },
}));

export default useAuthStore;
