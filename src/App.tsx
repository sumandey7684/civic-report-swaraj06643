import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/Theme/ThemeProvider";
import { I18nextProvider } from "react-i18next";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import i18n from "./i18n";
import { AuthProvider } from "./hooks/useAuth";
import { ProtectedRoute } from "./components/ProtectedRoute";

// Locomotive Scroll
// import LocomotiveScroll from "locomotive-scroll";
// import "locomotive-scroll/dist/locomotive-scroll.css";

// Modals
// import WelcomeModal from "./components/WelcomeModal";
// import PrivacyPolicyModal from "./components/PrivacyPolicyModal";

// Pages
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
import AdminLogin from "./pages/AdminLogin";
import SettingsPage from "./pages/SettingsPage";

// Components
import Chatbot from "@/components/Home/Chatbot";

const queryClient = new QueryClient();

const App: React.FC = () => {
  useEffect(() => {
    // Locomotive Scroll disabled in favor of Lenis (initialized in main.tsx)
    /*
    const scrollEl = document.querySelector("[data-scroll-container]") as HTMLElement | null;
    if (!scrollEl) return;

    const scroll = new LocomotiveScroll({
      el: scrollEl,
      smooth: true,
      lerp: 0.08,
      smartphone: { smooth: true },
      tablet: { smooth: true },
    });

    return () => {
      scroll.destroy();
    };
    */
  }, []);

  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <TooltipProvider>
            {/* Global Modals */}
            {/* <WelcomeModal /> */}
            {/* <PrivacyPolicyModal /> */}

            {/* Toasts */}
            <Toaster />
            <Sonner />

            {/* Locomotive Scroll Container */}
            <div data-scroll-container>
              <BrowserRouter>
                <Routes>
                  {/* Public Pages */}
                  <Route path="/" element={<Index />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicy />} />

                  {/* Protected Citizen Pages */}
                  <Route 
                    path="/report" 
                    element={
                      <ProtectedRoute>
                        <ReportIssue />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/map" 
                    element={
                      <ProtectedRoute>
                        <MapExplorer />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/account" 
                    element={
                      <ProtectedRoute>
                        <Account />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/settings" 
                    element={
                      <ProtectedRoute>
                        <SettingsPage />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/dashboard" 
                    element={
                      <ProtectedRoute>
                        <DashboardPage />
                      </ProtectedRoute>
                    } 
                  />

                  {/* Admin Protected Pages */}
                  <Route 
                    path="/admin" 
                    element={
                      <ProtectedRoute requireAdmin>
                        <AdminDashboard />
                      </ProtectedRoute>
                    } 
                  />
                  <Route path="/admin-login" element={<AdminLogin />} />
                  <Route path="/reset-password" element={<ResetPassword />} />

                  {/* Catch-all */}
                  <Route path="*" element={<NotFound />} />
                </Routes>

                {/* Global Chatbot */}
                <Chatbot />
              </BrowserRouter>
            </div>
            </TooltipProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </I18nextProvider>
  );
};

export default App;
