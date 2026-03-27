import React, { useState } from "react";
import { LogIn, User, Lock, Eye, EyeOff } from "lucide-react";
import { toast } from "react-hot-toast";
import Cookies from "js-cookie";
import Panel from "../../components/ui/Panel";
import InputField from "../../components/ui/InputField";
import Button from "../../components/ui/Button";
import { useTheme } from "../../hooks/useTheme";
import { login } from "./auth.service";  // Direct import
import { useNavigate } from "react-router";

// Cookie keys
const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const USER_INFO_KEY = "userInfo";

const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const { theme } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    const usernameOrEmail = formData.get("usernameOrEmail") as string;
    const password = formData.get("password") as string;
    const remember = formData.get("rememberMe") === "on";
    
    if (!usernameOrEmail || !password) {
      setError("Please fill in all fields");
      return;
    }
    
    setIsLoading(true);
    setError("");
    
    try {
      const payload = { usernameOrEmail, password };
      const response = await login(payload);  // Direct call
      console.log(response);
      
      
      if (response?.data?.success) {
        const { accessToken, refreshToken, user } = response.data;
        
        // Store tokens in cookies
        const cookieConfig = {
          expires: remember ? 7 : undefined,
          secure: import.meta.env.PROD,
          sameSite: "strict" as const,
          path: "/",
        };
        
        Cookies.set(ACCESS_TOKEN_KEY, accessToken, cookieConfig);
        Cookies.set(REFRESH_TOKEN_KEY, refreshToken, cookieConfig);
        Cookies.set(USER_INFO_KEY, JSON.stringify(user), cookieConfig);
        
        toast.success("Login successful! Redirecting...");
        navigate("/");
      } else {
        setError("Invalid username or password");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070&auto=format&fit=crop")',
        }}
      >
        <div className={`absolute inset-0 ${theme === 'dark' ? 'bg-black/70' : 'bg-black/40'}`} />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20" />
      </div>

      <div className="relative z-10 w-full max-w-lg px-4">
        <div className="backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-4">
          <Panel className="bg-transparent! shadow-none!">
            <h1 className="mb-3 text-xl text-center text-white">Log In</h1>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 bg-red-500/20 backdrop-blur-sm border border-red-500/30 text-red-100 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <InputField
                label="Username or Email"
                inputClassName="text-white"
                labelClassName="text-red-100"
                name="usernameOrEmail"
                type="text"
                placeholder="admin"
                disabled={isLoading}
                isRequired
              />

              <div className="relative">
                <InputField
                  label="Password"
                  inputClassName="text-white"
                  labelClassName="text-red-100"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  disabled={isLoading}
                  isRequired
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-9 text-gray-400 hover:text-gray-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-white/20 border-white/30 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <span className="text-sm text-white/80">Remember me</span>
                </label>
                <button
                  type="button"
                  className="text-sm text-blue-300 hover:text-blue-200 transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              <Button
                type="submit"
                variant="primary"
                fullWidth
                loading={isLoading}
                icon={<LogIn className="w-4 h-4" />}
                className="bg-blue-600/80 hover:bg-blue-700/80 backdrop-blur-sm border border-blue-400/30"
              >
                {isLoading ? "Logging in..." : "Login"}
              </Button>
            </form>
          </Panel>
        </div>
      </div>
    </div>
  );
};

export default Login;