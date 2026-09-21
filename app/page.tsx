"use client";

import { useState } from "react";
import Auth from "@/components/auth";
import HomePage from "@/components/home-page";

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  if (!isAuthenticated) {
    return <Auth onLogin={() => setIsAuthenticated(true)} />;
  }

  return <HomePage onLogout={() => setIsAuthenticated(false)} />;
}
