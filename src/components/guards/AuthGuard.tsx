import Cookies from "js-cookie";
import { ReactNode, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";

interface AppGuardProps {
  children: ReactNode;
}

const AuthGuard = ({ children }: AppGuardProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const accessToken = Cookies.get("accessToken");

  // ✅ শুধু প্রথমবার mount হওয়ার সময় একবারই চেক হবে
  useEffect(() => {
    setIsChecking(false);
  }, []);

  // ✅ Redirect logic আলাদা effect এ, কিন্তু render ব্লক করবে না
  useEffect(() => {
    if (!accessToken && location.pathname !== "/sign-in") {
      navigate("/sign-in", { replace: true });
    }
    if (accessToken && location.pathname === "/sign-in") {
      navigate("/", { replace: true });
    }
  }, [accessToken, location.pathname, navigate]);

  // ✅ শুধু প্রথম লোডে spinner দেখাবে
  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Invalid state এ কিছু render করবে না (redirect হওয়ার আগ পর্যন্ত)
  if (
    (!accessToken && location.pathname !== "/sign-in") ||
    (accessToken && location.pathname === "/sign-in")
  ) {
    return null;
  }

  return <>{children}</>;
};

export default AuthGuard;
