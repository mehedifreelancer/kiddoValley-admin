import { useEffect, ReactNode, useState } from "react";
import { useNavigate, useLocation } from "react-router";
import Cookies from "js-cookie";

interface AppGuardProps {
  children: ReactNode;
}

const AuthGuard = ({ children }: AppGuardProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const accessToken = Cookies.get("accessToken");

  useEffect(() => {
    setIsChecking(true);

    // Small delay to prevent flickering
    const timer = setTimeout(() => {
      // If no token and trying to access protected route, redirect to sign-in
      if (!accessToken && location.pathname !== "/sign-in") {
        navigate("/sign-in", { replace: true });
      }

      // If has token and trying to access sign-in, redirect to home
      if (accessToken && location.pathname === "/sign-in") {
        navigate("/", { replace: true });
      }

      setIsChecking(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [accessToken, location.pathname, navigate]);

  // Show loading spinner while checking
  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Don't render anything while redirecting
  if (
    (!accessToken && location.pathname !== "/sign-in") ||
    (accessToken && location.pathname === "/sign-in")
  ) {
    return null;
  }

  return <>{children}</>;
};

export default AuthGuard;
