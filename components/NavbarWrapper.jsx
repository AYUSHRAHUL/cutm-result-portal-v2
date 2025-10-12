"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";

export default function NavbarWrapper() {
  const pathname = usePathname() || "";
  const hideOnAuth = pathname === "/login" || pathname === "/register";
  if (hideOnAuth) return null;
  return <Navbar />;
}


