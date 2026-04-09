import React, { useState, useRef } from "react";
import { Header } from "@/components/Layout/Header";
import { Footer } from "@/components/Layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Shield, Users, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { authApi } from "@/lib/api";
import { motion } from "framer-motion";

// --- SIGNUP FORM TYPES & VALIDATORS ---
type FormState = {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  aadhaar: string;
  password: string;
  confirmPassword: string;
};
type FormErrors = {
  [K in keyof FormState]?: string;
};
const initialForm: FormState = {
  fullName: "",
  email: "",
  phone: "",
  address: "",
  aadhaar: "",
  password: "",
  confirmPassword: "",
};

const signupValidators = {
  fullName: (v: string, _form?: FormState) =>
    !v.trim()
      ? "Full Name is required."
      : !/^[A-Za-z ]+$/.test(v)
      ? "Only alphabets and spaces allowed."
      : "",
  email: (v: string, _form?: FormState) =>
    !v.trim()
      ? "Email is required."
      : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
      ? "Invalid email address."
      : "",
  phone: (v: string, _form?: FormState) =>
    !v.trim()
      ? "Phone number is required."
      : !/^\d{10}$/.test(v.replace(/\D/g, ""))
      ? "Enter a valid 10-digit phone number."
      : "",
  address: (v: string, _form?: FormState) =>
    !v.trim() ? "Residential address is required." : "",
  aadhaar: (v: string, _form?: FormState) =>
    !v.trim()
      ? "Aadhaar number is required."
      : !/^\d{12}$/.test(v.replace(/\D/g, ""))
      ? "Aadhaar must be exactly 12 digits."
      : "",
  password: (v: string, _form?: FormState) =>
    !v
      ? "Password is required."
      : v.length < 6
      ? "Password must be at least 6 characters."
      : "",
  confirmPassword: (v: string, form: FormState) =>
    v !== form.password ? "Passwords do not match." : "",
};

// --- MAIN COMPONENT ---
const Login = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [selectedRole, setSelectedRole] = useState<"citizen" | "admin" | null>(
    null
  );
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- SIGNUP FORM STATE ---
  const [signupForm, setSignupForm] = useState<FormState>(initialForm);
  const [signupErrors, setSignupErrors] = useState<FormErrors>({});
  const [signupTouched, setSignupTouched] = useState<{
    [K in keyof FormState]?: boolean;
  }>({});
  const [signupSubmitting, setSignupSubmitting] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [aadhaarMasked, setAadhaarMasked] = useState(false);
  const aadhaarInputRef = useRef<HTMLInputElement>(null);

  // --- SIGNUP VALIDATION ---
  const validateSignupAll = (): FormErrors => {
    const newErrors: FormErrors = {};
    (Object.keys(signupForm) as (keyof FormState)[]).forEach((key) => {
      if (key === "confirmPassword" && !signupForm.password) return;
      const err = signupValidators[key](signupForm[key], signupForm);
      if (err) newErrors[key] = err;
    });
    return newErrors;
  };
  const isSignupValid = () => {
    const errs = validateSignupAll();
    return Object.values(errs).every((v) => !v);
  };
  const handleSignupChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    let val = value;
    if (name === "phone") {
      val = val.replace(/\D/g, "").slice(0, 10);
      if (val.length > 3 && val.length <= 6)
        val = `${val.slice(0, 3)}-${val.slice(3)}`;
      else if (val.length > 6)
        val = `${val.slice(0, 3)}-${val.slice(3, 6)}-${val.slice(6)}`;
    }
    if (name === "aadhaar") {
      val = val.replace(/\D/g, "").slice(0, 12);
      setAadhaarMasked(false);
    }
    setSignupForm((prev) => ({ ...prev, [name]: val }));
    setSignupTouched((prev) => ({ ...prev, [name]: true }));
    setSignupErrors((prev) => ({
      ...prev,
      [name]: signupValidators[name as keyof FormState](val, {
        ...signupForm,
        [name]: val,
      }),
    }));
  };
  const handleSignupBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name } = e.target;
    setSignupTouched((prev) => ({ ...prev, [name]: true }));
    setSignupErrors((prev) => ({
      ...prev,
      [name]: signupValidators[name as keyof FormState](
        signupForm[name as keyof FormState],
        signupForm
      ),
    }));
    <textarea
      id="address"
      name="address"
      placeholder="Enter your address"
      value={signupForm.address}
      onChange={handleSignupChange}
      onBlur={handleSignupBlur}
      autoComplete="street-address"
      aria-invalid={!!signupErrors.address}
      aria-describedby="address-error"
      disabled={signupSubmitting}
      className={`transition-all w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
        signupErrors.address && signupTouched.address
          ? "border-red-500 focus:ring-red-400"
          : ""
      }`}
      rows={2}
      style={{ resize: "vertical" }}
    />;
    setAadhaarMasked(false);
    aadhaarInputRef.current?.blur();
  };
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupTouched({
      fullName: true,
      email: true,
      phone: true,
      address: true,
      aadhaar: true,
      password: true,
      confirmPassword: true,
    });
    const errs = validateSignupAll();
    setSignupErrors(errs);
    if (Object.values(errs).some((v) => v)) return;
    setSignupSubmitting(true);

    const { data, error } = await authApi.signup({
      email: signupForm.email,
      password: signupForm.password,
      fullName: signupForm.fullName,
      phone: signupForm.phone.replace(/\D/g, ""),
      address: signupForm.address,
      aadhaar: signupForm.aadhaar,
    });

    if (error) {
      setSignupErrors({ email: error });
      setSignupSubmitting(false);
      return;
    }

    setSignupSuccess(true);
    setSignupSubmitting(false);
    setSignupForm(initialForm);
    setSignupTouched({});
    setAadhaarMasked(false);
    // Redirect to identity verification after signup
    setTimeout(() => {
      window.location.href = "/verify-identity";
    }, 1500);
  };

  // Authentication function using Neon backend
  const authenticate = async (
    email: string,
    password: string,
    role: "citizen" | "admin"
  ) => {
    if (role !== "citizen") {
      throw new Error("This Mail is not supported for Admin login.");
    }
    const { data, error } = await authApi.login(email, password);
    if (error) {
      throw new Error(error || "Invalid credentials");
    }
    return { success: true };
  };

  const validateEmail = (email: string) => {
    // Simple email regex
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleRoleSelect = (role: "citizen" | "admin") => {
    setSelectedRole(role);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedRole) {
      setError("Please choose a role before logging in.");
      return;
    }
    if (!validateEmail(formData.email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      await authenticate(formData.email, formData.password, selectedRole);
      if (selectedRole === "admin") {
        navigate("/admin");
      } else {
        navigate("/account");
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || "Login failed. Please try again.");
      } else {
        setError("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // -------- ROLE SELECTION --------
  if (!selectedRole) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20 pb-12">
          <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-12">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="flex items-center gap-4 mb-6"
              >
                <Button
                  variant="outline"
                  onClick={() => navigate("/")}
                  className="btn-framer-ghost"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Home
                </Button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-center"
              >
                <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-4">
                  Choose Your Role
                </h1>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                  Select how you'd like to access the CivicReport platform
                </p>
              </motion.div>
            </div>
          </section>

          <section className="py-16">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Citizen Card */}
                <motion.div
                  initial={{ opacity: 0, x: -40 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8 }}
                >
                  <Card className="glass-effect border-0 shadow-[var(--shadow-elevated)] hover:shadow-[var(--shadow-glow)] transition-all duration-300 hover:scale-105 h-full">
                    <CardHeader className="text-center space-y-4">
                      <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                        <Users className="h-10 w-10 text-primary" />
                      </div>
                      <CardTitle className="text-2xl">Citizen Portal</CardTitle>
                      <CardDescription>
                        Report civic issues, track your submissions, and engage
                        with your community
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button
                        className="btn-framer-primary w-full"
                        onClick={() => handleRoleSelect("citizen")}
                      >
                        Continue as Citizen
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Admin Card */}
                <motion.div
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8 }}
                >
                  <Card className="glass-effect border-0 shadow-[var(--shadow-elevated)] hover:shadow-[var(--shadow-glow)] transition-all duration-300 hover:scale-105 h-full">
                    <CardHeader className="text-center space-y-4">
                      <div className="w-20 h-20 bg-secondary/10 rounded-full flex items-center justify-center mx-auto">
                        <Shield className="h-10 w-10 text-secondary" />
                      </div>
                      <CardTitle className="text-2xl">
                        Admin Dashboard
                      </CardTitle>
                      <CardDescription>
                        Manage civic issues, assign tasks, and oversee
                        resolution processes
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button
                        className="btn-framer-secondary w-full"
                        onClick={() => handleRoleSelect("admin")}
                      >
                        Continue as Admin
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    );
  }

  // -------- SIGNUP FORM --------
  if (mode === "signup") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center py-8 px-2">
          <div className="w-full max-w-lg mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <Card className="glass-effect border-0 shadow-[var(--shadow-elevated)]">
                <CardHeader className="text-center space-y-2">
                  <CardTitle className="text-3xl font-bold">Sign Up</CardTitle>
                  <CardDescription>
                    Create your CivicReport account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {signupSuccess ? (
                    <div className="text-center py-8">
                      <div className="text-green-600 text-2xl font-semibold mb-2">
                        Registration Successful!
                      </div>
                      <div className="text-muted-foreground mb-4">
                        You can now log in to your account.
                      </div>
                      <Button
                        className="btn-framer-primary w-full"
                        onClick={() => {
                          setMode("login");
                          setSignupSuccess(false);
                        }}
                      >
                        Go to Login
                      </Button>
                      <Button
                        variant="ghost"
                        className="mt-2 w-full"
                        onClick={() => {
                          setSignupForm(initialForm);
                          setSignupErrors({});
                          setSignupTouched({});
                          setSignupSuccess(false);
                          setAadhaarMasked(false);
                          aadhaarInputRef.current?.blur();
                        }}
                      >
                        Register another account
                      </Button>
                    </div>
                  ) : (
                    <form
                      onSubmit={handleSignupSubmit}
                      className="space-y-5"
                      autoComplete="off"
                      aria-busy={signupSubmitting}
                    >
                      {/* Full Name */}
                      <div>
                        <label
                          htmlFor="fullName"
                          className="block text-sm font-medium text-foreground mb-1"
                        >
                          Full Name
                        </label>
                        <Input
                          id="fullName"
                          name="fullName"
                          type="text"
                          placeholder="Enter your full name"
                          value={signupForm.fullName}
                          onChange={handleSignupChange}
                          onBlur={handleSignupBlur}
                          autoComplete="name"
                          aria-invalid={!!signupErrors.fullName}
                          aria-describedby="fullName-error"
                          disabled={signupSubmitting}
                          className={`transition-all ${
                            signupErrors.fullName && signupTouched.fullName
                              ? "border-red-500 focus:ring-red-400"
                              : ""
                          }`}
                        />
                        <div
                          id="fullName-error"
                          className={`text-xs text-red-600 mt-1 min-h-[18px] transition-all`}
                          aria-live="polite"
                        >
                          {signupTouched.fullName && signupErrors.fullName}
                        </div>
                      </div>
                      {/* Email */}
                      <div>
                        <label
                          htmlFor="email"
                          className="block text-sm font-medium text-foreground mb-1"
                        >
                          Email Address
                        </label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="Enter your email"
                          value={signupForm.email}
                          onChange={handleSignupChange}
                          onBlur={handleSignupBlur}
                          autoComplete="email"
                          aria-invalid={!!signupErrors.email}
                          aria-describedby="email-error"
                          disabled={signupSubmitting}
                          className={`transition-all ${
                            signupErrors.email && signupTouched.email
                              ? "border-red-500 focus:ring-red-400"
                              : ""
                          }`}
                        />
                        <div
                          id="email-error"
                          className="text-xs text-red-600 mt-1 min-h-[18px] transition-all"
                          aria-live="polite"
                        >
                          {signupTouched.email && signupErrors.email}
                        </div>
                      </div>
                      {/* Phone */}
                      <div>
                        <label
                          htmlFor="phone"
                          className="block text-sm font-medium text-foreground mb-1"
                        >
                          Phone Number
                        </label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          placeholder="e.g. 987-654-3210"
                          value={signupForm.phone}
                          onChange={handleSignupChange}
                          onBlur={handleSignupBlur}
                          autoComplete="tel"
                          aria-invalid={!!signupErrors.phone}
                          aria-describedby="phone-error"
                          disabled={signupSubmitting}
                          inputMode="numeric"
                          pattern="\d{3}-\d{3}-\d{4}"
                          className={`transition-all ${
                            signupErrors.phone && signupTouched.phone
                              ? "border-red-500 focus:ring-red-400"
                              : ""
                          }`}
                        />
                        <div
                          id="phone-error"
                          className="text-xs text-red-600 mt-1 min-h-[18px] transition-all"
                          aria-live="polite"
                        >
                          {signupTouched.phone && signupErrors.phone}
                        </div>
                      </div>
                      {/* Address */}
                      <div>
                        <label
                          htmlFor="address"
                          className="block text-sm font-medium text-foreground mb-1"
                        >
                          Residential Address
                        </label>
                        <textarea
                          id="address"
                          name="address"
                          placeholder="Enter your address"
                          value={signupForm.address}
                          onChange={handleSignupChange}
                          onBlur={handleSignupBlur}
                          autoComplete="street-address"
                          aria-invalid={!!signupErrors.address}
                          aria-describedby="address-error"
                          disabled={signupSubmitting}
                          className={`transition-all w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                            signupErrors.address && signupTouched.address
                              ? "border-red-500 focus:ring-red-400"
                              : ""
                          }`}
                          rows={2}
                          style={{ resize: "vertical" }}
                        />
                        <div
                          id="address-error"
                          className="text-xs text-red-600 mt-1 min-h-[18px] transition-all"
                          aria-live="polite"
                        >
                          {signupTouched.address && signupErrors.address}
                        </div>
                      </div>
                      {/* Aadhaar */}
                      <div>
                        <label
                          htmlFor="aadhaar"
                          className="block text-sm font-medium text-foreground mb-1"
                        >
                          Aadhaar Card Number
                        </label>
                        <Input
                          id="aadhaar"
                          name="aadhaar"
                          type={aadhaarMasked ? "password" : "text"}
                          placeholder="12-digit Aadhaar number"
                          value={
                            !signupForm.aadhaar
                              ? ""
                              : aadhaarMasked
                              ? "*".repeat(signupForm.aadhaar.length - 4) +
                                signupForm.aadhaar.slice(-4)
                              : signupForm.aadhaar
                          }
                          onChange={handleSignupChange}
                          onBlur={() => {
                            setSignupTouched((prev) => ({
                              ...prev,
                              aadhaar: true,
                            }));
                            setAadhaarMasked(true);
                          }}
                          onFocus={() => setAadhaarMasked(false)}
                          autoComplete="off"
                          aria-invalid={!!signupErrors.aadhaar}
                          aria-describedby="aadhaar-error"
                          disabled={signupSubmitting}
                          inputMode="numeric"
                          pattern="\d{12}"
                          ref={aadhaarInputRef}
                          className={`transition-all tracking-widest ${
                            signupErrors.aadhaar && signupTouched.aadhaar
                              ? "border-red-500 focus:ring-red-400"
                              : ""
                          }`}
                          maxLength={12}
                        />
                        <div
                          id="aadhaar-error"
                          className="text-xs text-red-600 mt-1 min-h-[18px] transition-all"
                          aria-live="polite"
                        >
                          {signupTouched.aadhaar && signupErrors.aadhaar}
                        </div>
                      </div>
                      {/* Password */}
                      <div>
                        <label
                          htmlFor="password"
                          className="block text-sm font-medium text-foreground mb-1"
                        >
                          Password
                        </label>
                        <div className="relative">
                          <Input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Create a password"
                            value={signupForm.password}
                            onChange={handleSignupChange}
                            onBlur={handleSignupBlur}
                            autoComplete="new-password"
                            aria-invalid={!!signupErrors.password}
                            aria-describedby="password-error"
                            disabled={signupSubmitting}
                            className={`transition-all pr-10 ${
                              signupErrors.password && signupTouched.password
                                ? "border-red-500 focus:ring-red-400"
                                : ""
                            }`}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            aria-label={
                              showPassword ? "Hide password" : "Show password"
                            }
                            className="absolute right-2 top-2 h-6"
                            onClick={() => setShowPassword((v) => !v)}
                            tabIndex={-1}
                            disabled={signupSubmitting}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                      {/* Confirm Password */}
                      <div>
                        <label
                          htmlFor="confirmPassword"
                          className="block text-sm font-medium text-foreground mb-1"
                        >
                          Confirm Password
                        </label>
                        <div className="relative">
                          <Input
                            id="confirmPassword"
                            name="confirmPassword"
                            type={showConfirm ? "text" : "password"}
                            placeholder="Re-enter your password"
                            value={signupForm.confirmPassword}
                            onChange={handleSignupChange}
                            onBlur={handleSignupBlur}
                            autoComplete="new-password"
                            aria-invalid={!!signupErrors.confirmPassword}
                            aria-describedby="confirmPassword-error"
                            disabled={signupSubmitting}
                            className={`transition-all pr-10 ${
                              signupErrors.confirmPassword &&
                              signupTouched.confirmPassword
                                ? "border-red-500 focus:ring-red-400"
                                : ""
                            }`}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            aria-label={
                              showConfirm ? "Hide password" : "Show password"
                            }
                            className="absolute right-2 top-2 h-6"
                            onClick={() => setShowConfirm((v) => !v)}
                            tabIndex={-1}
                            disabled={signupSubmitting}
                          >
                            {showConfirm ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        <div
                          id="confirmPassword-error"
                          className="text-xs text-red-600 mt-1 min-h-[18px] transition-all"
                          aria-live="polite"
                        >
                          {signupTouched.confirmPassword &&
                            signupErrors.confirmPassword}
                        </div>
                      </div>
                      {/* Submit & Reset */}
                      <div className="flex flex-col gap-2 mt-4">
                        <Button
                          type="submit"
                          className="btn-framer-primary w-full"
                          disabled={signupSubmitting || !isSignupValid()}
                          aria-disabled={signupSubmitting || !isSignupValid()}
                        >
                          {signupSubmitting ? "Registering..." : "Sign Up"}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          className="w-full"
                          onClick={() => {
                            setSignupForm(initialForm);
                            setSignupErrors({});
                            setSignupTouched({});
                            setSignupSuccess(false);
                            setAadhaarMasked(false);
                            aadhaarInputRef.current?.blur();
                          }}
                          disabled={signupSubmitting}
                        >
                          Reset Form
                        </Button>
                      </div>
                      {/* Already have account */}
                      <div className="text-center mt-3">
                        <span className="text-sm text-muted-foreground">
                          Already have an account?{" "}
                          <button
                            type="button"
                            className="text-primary hover:underline font-medium"
                            onClick={() => setMode("login")}
                            disabled={signupSubmitting}
                          >
                            Login
                          </button>
                        </span>
                      </div>
                    </form>
                  )}
                </CardContent>
              </Card>
              <Button
                variant="outline"
                className="mt-6 w-full btn-framer-ghost"
                onClick={() => navigate("/")}
                aria-label="Back to Home"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </motion.div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // -------- LOGIN FORM --------
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20 pb-12">
        <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex items-center gap-4 mb-6"
            >
              <Button
                variant="outline"
                onClick={() => setSelectedRole(null)}
                className="btn-framer-ghost"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Change Role
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-center"
            >
              <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-4">
                {selectedRole === "citizen" ? "Citizen" : "Admin"} Login
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Sign in to access your{" "}
                {selectedRole === "citizen" ? "citizen" : "admin"} dashboard
              </p>
            </motion.div>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-md">
            <Card className="glass-effect border-0 shadow-[var(--shadow-elevated)]">
              <CardHeader className="text-center space-y-4">
                <div
                  className={`w-16 h-16 ${
                    selectedRole === "citizen"
                      ? "bg-primary/10"
                      : "bg-secondary/10"
                  } rounded-full flex items-center justify-center mx-auto`}
                >
                  {selectedRole === "citizen" ? (
                    <Users className="h-8 w-8 text-primary" />
                  ) : (
                    <Shield className="h-8 w-8 text-secondary" />
                  )}
                </div>
                <CardTitle className="text-2xl">Welcome Back</CardTitle>
                <CardDescription>
                  Enter your credentials to access your {selectedRole ?? ""}{" "}
                  account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={handleSubmit}
                  className="space-y-6"
                  aria-busy={loading}
                >
                  <Input
                    type="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    required
                    aria-label="Email"
                    aria-invalid={!!error}
                    disabled={loading}
                  />
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          password: e.target.value,
                        }))
                      }
                      required
                      aria-label="Password"
                      aria-invalid={!!error}
                      disabled={loading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      className="absolute right-2 top-2 h-6"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                      disabled={loading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  {error && (
                    <div
                      className="text-red-600 text-sm text-center"
                      role="alert"
                      tabIndex={-1}
                    >
                      {error}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      className={
                        selectedRole === "citizen"
                          ? "btn-framer-primary w-full"
                          : "btn-framer-secondary w-full"
                      }
                      disabled={loading}
                    >
                      {loading ? "Signing In..." : "Sign In"}
                    </Button>
                    <Button
                      type="button"
                      className="btn-framer-outline w-full"
                      onClick={() => navigate("/account")}
                      disabled={loading}
                    >
                      Account
                    </Button>
                  </div>

                  <div className="text-center space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Don't have an account?{" "}
                      <button
                        type="button"
                        className={
                          selectedRole === "citizen"
                            ? "text-primary hover:underline font-medium"
                            : "text-secondary hover:underline font-medium"
                        }
                        onClick={() => setMode("signup")}
                        disabled={loading}
                      >
                        Sign up here
                      </button>
                    </p>
                    <button
                      type="button"
                      className="text-sm text-primary hover:underline"
                      onClick={() => navigate("/reset-password")}
                      disabled={loading}
                    >
                      Forgot your password?
                    </button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Login;
