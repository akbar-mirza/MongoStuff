import TopNavbar from "./navbar";

import { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="flex flex-col mx-auto">
      <TopNavbar />
      <main className="flex-1">{children}</main>
    </div>
  );
}
