import { useState } from "react";
import Login from "./login";
import Registration from "./registrtatia";
import EmailVerification from "./vereficationemail";
import ForgotPassword from "./forgotyourpassword";

interface AuthPageProps {
  mode?: "login" | "register";
  onSuccess: () => void;
  onSwitch: (mode: "login" | "register") => void;
  onBack: () => void;
}

export default function AuthPage({ mode = "login", onSuccess, onSwitch, onBack }: AuthPageProps) {
  const [currentPage, setCurrentPage] = useState<"login" | "register" | "verify" | "forgot" | "reset">(
    mode === "register" ? "register" : "login"
  );
  const [verificationEmail, setVerificationEmail] = useState("");

  const handleSwitchPage = (page: "login" | "register" | "verify" | "forgot" | "reset-password") => {
    setCurrentPage(page as any);
    // Update parent component if switching to login/register
    if (page === "login" || page === "register") {
      onSwitch(page);
    }
  };

  const handleForgotPasswordSuccess = () => {
    setCurrentPage("login");
  };

  const handleRegistrationToVerify = (email: string) => {
    setVerificationEmail(email);
    setCurrentPage("verify");
  };

  return (
    <>
      {currentPage === "login" && (
        <Login
          onSuccess={onSuccess}
          onBack={onBack}
          onSwitchTo={handleSwitchPage}
        />
      )}
      {currentPage === "register" && (
        <Registration
          onSuccess={handleRegistrationToVerify}
          onBack={onBack}
          onSwitchTo={handleSwitchPage}
        />
      )}
      {currentPage === "verify" && (
        <EmailVerification
          email={verificationEmail}
          onSuccess={onSuccess}
          onSwitchTo={handleSwitchPage}
        />
      )}
      {currentPage === "forgot" && (
        <ForgotPassword
          onSuccess={handleForgotPasswordSuccess}
          onSwitchTo={handleSwitchPage}
        />
      )}
    </>
  );
}
