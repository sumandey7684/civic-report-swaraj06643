import React, { useState, useRef } from "react";
import { Header } from "@/components/Layout/Header";
import { Footer } from "@/components/Layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Shield, Users, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { loginUser, registerUser } from "@/lib/authApi";

const Login = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [selectedRole, setSelectedRole] = useState<"citizen" | "admin" | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    phone: "",
    address: "",
    aadhaar: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "login") {
        if (!selectedRole) {
          setError("Please select a role");
          setLoading(false);
          return;
        }
        const data = await loginUser({ email: formData.email, password: formData.password });
        if (data.user.role !== selectedRole) {
          throw new Error(`Unauthorized: User is not registered as ${selectedRole}`);
        }
        navigate(selectedRole === "admin" ? "/admin" : "/account");
      } else {
        await registerUser({
          ...formData,
          role: "citizen"
        });
        setMode("login");
        setError(null);
        alert("Registration successful. Please login.");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (!selectedRole && mode === "login") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 pt-32 pb-12">
          <div className="container mx-auto max-w-4xl px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4 mb-20"
            >
              <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-none">
                Identity<br />Sync
              </h1>
              <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-black">
                Select authentication node to proceed
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-px bg-border border border-border">
              <div 
                onClick={() => setSelectedRole("citizen")}
                className="bg-background p-12 space-y-8 hover:bg-muted/50 transition-colors cursor-pointer group"
              >
                <div className="w-12 h-12 bg-foreground/5 flex items-center justify-center border border-border group-hover:scale-110 transition-transform mx-auto md:mx-0">
                  <Users className="h-6 w-6" />
                </div>
                <div className="space-y-2 md:text-left text-center">
                  <h3 className="text-xl font-black uppercase tracking-tighter text-foreground">Citizen</h3>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Public Reporting & Analytics</p>
                </div>
              </div>

              <div 
                onClick={() => setSelectedRole("admin")}
                className="bg-background p-12 space-y-8 hover:bg-muted/50 transition-colors cursor-pointer group"
              >
                <div className="w-12 h-12 bg-foreground/5 flex items-center justify-center border border-border group-hover:scale-110 transition-transform mx-auto md:mx-0">
                  <Shield className="h-6 w-6" />
                </div>
                <div className="space-y-2 md:text-left text-center">
                  <h3 className="text-xl font-black uppercase tracking-tighter text-foreground">Authority</h3>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Government Resolution Unit</p>
                </div>
              </div>
            </div>
            
            <div className="mt-12">
              <Button variant="link" onClick={() => navigate("/")} className="text-[10px] uppercase tracking-[0.2em] font-black opacity-40 hover:opacity-100">
                <ArrowLeft className="mr-2 h-3 w-3" /> Terminate Session
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 pt-32 pb-12 flex items-center justify-center">
        <div className="w-full max-w-md px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-4 mb-8"
          >
            <h1 className="text-4xl font-black uppercase tracking-tighter">
              {mode === "login" ? "Verification" : "Registration"}
            </h1>
            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-black">
              {selectedRole === "admin" ? "Administrative" : "Citizen"} Security Protocol
            </p>
          </motion.div>

          <Card className="border border-border rounded-none shadow-premium bg-background">
            <CardContent className="pt-12 pb-12">
              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === "signup" && (
                  <>
                    <Input
                      name="fullName"
                      placeholder="FULL LEGAL NAME"
                      className="h-12 border-border focus:border-foreground transition-all rounded-none uppercase text-[10px] tracking-widest font-black"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      required
                    />
                    <Input
                      name="phone"
                      placeholder="CONTACT NUMBER"
                      className="h-12 border-border focus:border-foreground transition-all rounded-none uppercase text-[10px] tracking-widest font-black"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                    />
                    <Input
                      name="aadhaar"
                      placeholder="AADHAAR IDENTIFIER"
                      className="h-12 border-border focus:border-foreground transition-all rounded-none uppercase text-[10px] tracking-widest font-black"
                      value={formData.aadhaar}
                      onChange={handleInputChange}
                      required
                    />
                    <textarea
                      name="address"
                      placeholder="RESIDENTIAL ADDRESS"
                      className="w-full min-h-[80px] p-3 bg-background border border-border focus:border-foreground transition-all rounded-none uppercase text-[10px] tracking-widest font-black outline-none"
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                    />
                  </>
                )}
                
                <Input
                  name="email"
                  type="email"
                  placeholder="IDENTIFIER (EMAIL)"
                  className="h-12 border-border focus:border-foreground transition-all rounded-none uppercase text-[10px] tracking-widest font-black"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
                
                <div className="relative">
                  <Input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="SECRET KEY (PASSWORD)"
                    className="h-12 border-border focus:border-foreground transition-all rounded-none uppercase text-[10px] tracking-widest font-black"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-2 h-8"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>

                {error && (
                  <div className="text-red-600 text-[10px] font-black uppercase tracking-widest text-center py-2">
                    ERROR: {error}
                  </div>
                )}

                <div className="space-y-3 pt-4">
                  <Button
                    type="submit"
                    className="w-full text-[10px] uppercase tracking-widest font-black rounded-none h-12"
                    disabled={loading}
                  >
                    {loading ? "Processing..." : mode === "login" ? "Authorize" : "Initialize"}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full text-[10px] uppercase tracking-widest font-black rounded-none h-12"
                    onClick={() => {
                      if (mode === "login") setSelectedRole(null);
                      else setMode("login");
                    }}
                    disabled={loading}
                  >
                    Back
                  </Button>
                </div>

                <div className="text-center pt-6 space-y-4">
                  {mode === "login" ? (
                    <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                      No entry record?{" "}
                      <button
                        type="button"
                        className="text-foreground hover:underline font-black"
                        onClick={() => setMode("signup")}
                      >
                        Register Module
                      </button>
                    </p>
                  ) : (
                    <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                      Already registered?{" "}
                      <button
                        type="button"
                        className="text-foreground hover:underline font-black"
                        onClick={() => setMode("login")}
                      >
                        Login Portal
                      </button>
                    </p>
                  )}
                  <button
                    type="button"
                    className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground hover:underline block mx-auto"
                    onClick={() => navigate("/reset-password")}
                  >
                    Recovery Protocol
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Login;
