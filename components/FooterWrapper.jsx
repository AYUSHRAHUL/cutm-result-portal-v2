"use client";

import { usePathname } from "next/navigation";
import Footer from "./Footer";

export default function FooterWrapper() {
  const pathname = usePathname() || "";
  const hideFooter = pathname === "/" || pathname === "/login" || pathname === "/register" || pathname === "/forgot-password";
  if (hideFooter) return null;
  return <Footer />;
}


