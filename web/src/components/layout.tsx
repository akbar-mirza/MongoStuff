import { GetCookie } from "../api";
import { useAuthStore } from "../stores/auth.store";
import AuthModal from "./auth/authModal";
import TopNavbar from "./navbar";

import { ReactNode, useEffect } from "react";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { getCurrentUser, user, setIsAuthModalOpen, isAuth } = useAuthStore();
  useEffect(() => {
    getCurrentUser();
  }, [getCurrentUser]);

  const crfToken = GetCookie("csrf");

  useEffect(() => {
    if (!user && !crfToken) {
      setIsAuthModalOpen(true);
    }
  }, [user, setIsAuthModalOpen, crfToken]);

  return (
    <div className="flex flex-col mx-auto">
      {!user && <AuthModal />}
      <TopNavbar />
      {isAuth && <main className="flex-1">{children}</main>}
    </div>
  );
}
