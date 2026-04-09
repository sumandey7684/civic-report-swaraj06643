import React from "react";
import { useNavigate } from "react-router-dom";
import DocumentVerifier from "@/components/ML/DocumentVerifier";

const VerifyIdentity: React.FC = () => {
  const navigate = useNavigate();

  const handleVerified = (result: any) => {
    // Store verification status
    if (result.isValid) {
      localStorage.setItem("civic_id_verified", "true");
      localStorage.setItem("civic_id_type", result.type);
    }
  };

  const handleSkip = () => {
    localStorage.setItem("civic_id_verified", "skipped");
    navigate("/account");
  };

  return (
    <DocumentVerifier
      onVerified={handleVerified}
      onSkip={handleSkip}
    />
  );
};

export default VerifyIdentity;
