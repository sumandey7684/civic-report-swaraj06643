import WelcomeModal from "./components/WelcomeModal";
import PrivacyPolicyModal from "./components/PrivacyPolicyModal";
import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/Theme/ThemeProvider";

import Index from "./pages/Index";
import MapExplorer from "./pages/MapExplorer";
import ReportIssue from "./pages/ReportIssue";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import { PrivacyPolicy } from "./pages/PrivacyPolicy";
import NotFound from "./pages/NotFound";
import DashboardPage from "@/pages/Dashboard";
import Account from "./pages/Account";
import ResetPassword from "./pages/ResetPassword";
import Chatbot from "@/components/Home/Chatbot";
import AdminLogin from "./pages/AdminLogin";
import SettingsPage from "./pages/SettingsPage";
import VerifyIdentity from "./pages/VerifyIdentity";

const queryClient = new QueryClient();

const App: React.FC = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <WelcomeModal />
        {/* Toasts / Notifications */}
        <Toaster />
        <Sonner />

        {/* Router */}
        <BrowserRouter>
          <Routes>
            {/* Public Pages */}
            <Route path="/" element={<Index />} />
            <Route path="/report" element={<ReportIssue />} />
            <Route path="/map" element={<MapExplorer />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />

            {/* Admin */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin-login" element={<AdminLogin />} />

            {/* Account / User */}
            <Route path="/account" element={<Account />} />
            <Route path="/account/settings" element={<SettingsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/verify-identity" element={<VerifyIdentity />} />

            {/* Extra Pages */}
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>

          {/* Global Chatbot */}
          <Chatbot />
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
