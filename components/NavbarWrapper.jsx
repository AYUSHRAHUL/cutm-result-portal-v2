"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";

export default function NavbarWrapper() {
  const pathname = usePathname() || "";
  const hideNavbar = pathname === "/" || pathname === "/login" || pathname === "/register" || pathname === "/forgot-password";
  if (hideNavbar) return null;
  return <Navbar />;
}


