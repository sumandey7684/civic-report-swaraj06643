import React, { useState, useRef } from "react";
import { Header } from "@/components/Layout/Header";
import { Footer } from "@/components/Layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { registerUser } from "@/lib/authApi";

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

const Signup: React.FC = () => {
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<{ [K in keyof FormState]?: boolean }>(
    {}
  );
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [aadhaarMasked, setAadhaarMasked] = useState(false);
  const navigate = useNavigate();
  const aadhaarInputRef = useRef<HTMLInputElement>(null);

  // Validation functions
  const validators = {
    fullName: (v: string) =>
      !v.trim()
        ? "Full Name is required."
        : !/^[A-Za-z ]+$/.test(v)
        ? "Only alphabets and spaces allowed."
        : "",
    email: (v: string) =>
      !v.trim()
        ? "Email is required."
        : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
        ? "Invalid email address."
        : "",
    phone: (v: string) =>
      !v.trim()
        ? "Phone number is required."
        : !/^\d{10}$/.test(v.replace(/\D/g, ""))
        ? "Enter a valid 10-digit phone number."
        : "",
    address: (v: string) =>
      !v.trim() ? "Residential address is required." : "",
    aadhaar: (v: string) =>
      !v.trim()
        ? "Aadhaar number is required."
        : !/^\d{12}$/.test(v.replace(/\D/g, ""))
        ? "Aadhaar must be exactly 12 digits."
        : "",
    password: (v: string) =>
      !v
        ? "Password is required."
        : v.length < 6
        ? "Password must be at least 6 characters."
        : "",
    confirmPassword: (v: string) =>
      v !== form.password ? "Passwords do not match." : "",
  };

  // Validate all fields
  const validateAll = (): FormErrors => {
    const newErrors: FormErrors = {};
    (Object.keys(form) as (keyof FormState)[]).forEach((key) => {
      if (key === "confirmPassword" && !form.password) return;
      const err = validators[key](form[key]);
      if (err) newErrors[key] = err;
    });
    return newErrors;
  };

  // Handle input change
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    let val = value;

    // Auto-format phone
    if (name === "phone") {
      val = val.replace(/\D/g, "").slice(0, 10);
      if (val.length > 3 && val.length <= 6)
        val = `${val.slice(0, 3)}-${val.slice(3)}`;
      else if (val.length > 6)
        val = `${val.slice(0, 3)}-${val.slice(3, 6)}-${val.slice(6)}`;
    }

    // Aadhaar: only digits, max 12
    if (name === "aadhaar") {
      val = val.replace(/\D/g, "").slice(0, 12);
      setAadhaarMasked(false);
    }

    setForm((prev) => ({ ...prev, [name]: val }));
    setTouched((prev) => ({ ...prev, [name]: true }));

    // Validate on change
    setErrors((prev) => ({
      ...prev,
      [name]: validators[name as keyof FormState](val),
    }));
  };

  // Mask Aadhaar after blur
  const handleAadhaarBlur = () => {
    setTouched((prev) => ({ ...prev, aadhaar: true }));
    setAadhaarMasked(true);
  };

  // Show Aadhaar on focus
  const handleAadhaarFocus = () => {
    setAadhaarMasked(false);
  };

  // Handle blur for other fields
  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({
      ...prev,
      [name]: validators[name as keyof FormState](
        form[name as keyof FormState]
      ),
    }));
  };

  // Is form valid?
  const isFormValid = () => {
    const errs = validateAll();
    return Object.values(errs).every((v) => !v);
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({
      fullName: true,
      email: true,
      phone: true,
      address: true,
      aadhaar: true,
      password: true,
      confirmPassword: true,
    });
    const errs = validateAll();
    setErrors(errs);
    if (Object.values(errs).some((v) => v)) return;

    setSubmitting(true);
    try {
      await registerUser({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        phone: form.phone,
        address: form.address,
        aadhaar: form.aadhaar,
        role: "citizen"
      });
      setSuccess(true);
      setForm(initialForm);
      setTouched({});
      setAadhaarMasked(false);
    } catch (err: any) {
      setErrors({ email: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  // Reset form
  const handleReset = () => {
    setForm(initialForm);
    setErrors({});
    setTouched({});
    setSuccess(false);
    setAadhaarMasked(false);
    aadhaarInputRef.current?.blur();
  };

  // Aadhaar masking logic
  const getMaskedAadhaar = () => {
    if (!form.aadhaar) return "";
    if (!aadhaarMasked) return form.aadhaar;
    // Show only last 4 digits
    const len = form.aadhaar.length;
    if (len <= 4) return "*".repeat(len);
    return "*".repeat(len - 4) + form.aadhaar.slice(-4);
  };

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
                {success ? (
                  <div className="text-center py-8">
                    <div className="text-green-600 text-2xl font-semibold mb-2">
                      Registration Successful!
                    </div>
                    <div className="text-muted-foreground mb-4">
                      You can now log in to your account.
                    </div>
                    <Button
                      className="btn-framer-primary w-full"
                      onClick={() => navigate("/login")}
                    >
                      Go to Login
                    </Button>
                    <Button
                      variant="ghost"
                      className="mt-2 w-full"
                      onClick={handleReset}
                    >
                      Register another account
                    </Button>
                  </div>
                ) : (
                  <form
                    onSubmit={handleSubmit}
                    className="space-y-5"
                    autoComplete="off"
                    aria-busy={submitting}
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
                        value={form.fullName}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        autoComplete="name"
                        aria-invalid={!!errors.fullName}
                        aria-describedby="fullName-error"
                        disabled={submitting}
                        className={`transition-all ${
                          errors.fullName && touched.fullName
                            ? "border-red-500 focus:ring-red-400"
                            : ""
                        }`}
                      />
                      <div
                        id="fullName-error"
                        className={`text-xs text-red-600 mt-1 min-h-[18px] transition-all`}
                        aria-live="polite"
                      >
                        {touched.fullName && errors.fullName}
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
                        value={form.email}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        autoComplete="email"
                        aria-invalid={!!errors.email}
                        aria-describedby="email-error"
                        disabled={submitting}
                        className={`transition-all ${
                          errors.email && touched.email
                            ? "border-red-500 focus:ring-red-400"
                            : ""
                        }`}
                      />
                      <div
                        id="email-error"
                        className="text-xs text-red-600 mt-1 min-h-[18px] transition-all"
                        aria-live="polite"
                      >
                        {touched.email && errors.email}
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
                        value={form.phone}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        autoComplete="tel"
                        aria-invalid={!!errors.phone}
                        aria-describedby="phone-error"
                        disabled={submitting}
                        inputMode="numeric"
                        pattern="\d{3}-\d{3}-\d{4}"
                        className={`transition-all ${
                          errors.phone && touched.phone
                            ? "border-red-500 focus:ring-red-400"
                            : ""
                        }`}
                      />
                      <div
                        id="phone-error"
                        className="text-xs text-red-600 mt-1 min-h-[18px] transition-all"
                        aria-live="polite"
                      >
                        {touched.phone && errors.phone}
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
                      <Textarea
                        id="address"
                        name="address"
                        placeholder="Enter your address"
                        value={form.address}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        autoComplete="street-address"
                        aria-invalid={!!errors.address}
                        aria-describedby="address-error"
                        disabled={submitting}
                        className={`transition-all ${
                          errors.address && touched.address
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
                        {touched.address && errors.address}
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
                        value={getMaskedAadhaar()}
                        onChange={handleChange}
                        onBlur={handleAadhaarBlur}
                        onFocus={handleAadhaarFocus}
                        autoComplete="off"
                        aria-invalid={!!errors.aadhaar}
                        aria-describedby="aadhaar-error"
                        disabled={submitting}
                        inputMode="numeric"
                        pattern="\d{12}"
                        ref={aadhaarInputRef}
                        className={`transition-all tracking-widest ${
                          errors.aadhaar && touched.aadhaar
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
                        {touched.aadhaar && errors.aadhaar}
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
                          value={form.password}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          autoComplete="new-password"
                          aria-invalid={!!errors.password}
                          aria-describedby="password-error"
                          disabled={submitting}
                          className={`transition-all pr-10 ${
                            errors.password && touched.password
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
                          disabled={submitting}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <div
                        id="password-error"
                        className="text-xs text-red-600 mt-1 min-h-[18px] transition-all"
                        aria-live="polite"
                      >
                        {touched.password && errors.password}
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
                          value={form.confirmPassword}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          autoComplete="new-password"
                          aria-invalid={!!errors.confirmPassword}
                          aria-describedby="confirmPassword-error"
                          disabled={submitting}
                          className={`transition-all pr-10 ${
                            errors.confirmPassword && touched.confirmPassword
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
                          disabled={submitting}
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
                        {touched.confirmPassword && errors.confirmPassword}
                      </div>
                    </div>
                    {/* Submit & Reset */}
                    <div className="flex flex-col gap-2 mt-4">
                      <Button
                        type="submit"
                        className="btn-framer-primary w-full"
                        disabled={submitting || !isFormValid()}
                        aria-disabled={submitting || !isFormValid()}
                      >
                        {submitting ? "Registering..." : "Sign Up"}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="w-full"
                        onClick={handleReset}
                        disabled={submitting}
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
                          onClick={() => navigate("/login")}
                          disabled={submitting}
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
};

export default Signup;
