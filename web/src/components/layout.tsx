import { useAuthStore } from "../stores/auth.store";
import AuthModal from "./auth/authModal";
import TopNavbar from "./navbar";

import { ReactNode, useEffect } from "react";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { getCurrentUser, user, isAuth } = useAuthStore();

  useEffect(() => {
    getCurrentUser();
  }, []);

  return (
    <div className="flex flex-col mx-auto">
      {!user && <AuthModal />}
      <TopNavbar />
      {isAuth && <main className="flex-1">{children}</main>}
    </div>
  );
}
