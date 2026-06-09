import { toast } from "sonner";
import { create } from "zustand";
import { AuthAPI } from "../api/auth";

export type User = {
  username: string;
  userID: string;
  lastLogin: number;
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
      toast.error(error.error);
      set({ isAuthModalOpen: true });
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
    set({ user: null, isAuth: false, isAuthModalOpen: true });
  },
}));
