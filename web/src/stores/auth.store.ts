import { toast } from "sonner";
import { create } from "zustand";
import { ClearCookies } from "../api";
import { AuthAPI } from "../api/auth";

export type User = {
  username: string;
  userID: string;
  csrfToken: string;
};

type AuthStore = {
  user: User | null;
  setUser: (user: User) => void;
  clearUser: () => void;
  getCurrentUser: () => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (isOpen: boolean) => void;
  isAuth: boolean;
  signOut: () => void;
};

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuth: false,
  setUser: (user: User) => set({ user }),
  clearUser: () => set({ user: null }),
  getCurrentUser: async () => {
    const { user, error } = await AuthAPI.CurretUserRequest();
    if (error?.error) {
      console.error(error);
      toast.error(error.error);
      ClearCookies();
      set({ isAuth: false });
      set({ user: null });
      return;
    }
    set({ user: user?.user });
    set({ isAuth: true });
  },
  isAuthModalOpen: false,
  setIsAuthModalOpen: (isOpen: boolean) => set({ isAuthModalOpen: isOpen }),
  signOut: async () => {
    await AuthAPI.LogoutRequest();
    // remove all cookies
    ClearCookies();
  },
}));
