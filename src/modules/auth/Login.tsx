import React, { useEffect, useState } from "react";
import { useActionState } from "react";
import { LogIn, User, Lock, CheckCircle, Eye, EyeOff } from "lucide-react";
import Panel from "../../components/ui/Panel";
import InputField from "../../components/ui/InputField";
import Button from "../../components/ui/Button";
import { useTheme } from "../../hooks/useTheme";
import { Dropdown } from "primereact/dropdown";



interface FormState {
    success: boolean;
    message: string;
    errors?: {
        usernameOrEmail?: string[];
        password?: string[];
    };
}

const Login: React.FC = () => {
      const [selectedCountry, setSelectedCountry] = useState(null);
  const countries = [
    { name: 'Australia', code: 'AU' },
    { name: 'Brazil', code: 'BR' },
    { name: 'China', code: 'CN' },
    { name: 'Egypt', code: 'EG' },
    { name: 'France', code: 'FR' },
    { name: 'Germany', code: 'DE' },
    { name: 'India', code: 'IN' },
    { name: 'Japan', code: 'JP' },
    { name: 'Spain', code: 'ES' },
    { name: 'United States', code: 'US' }
  ];
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const { theme } = useTheme();

    useEffect(() => {
        const savedUsername = localStorage.getItem("rememberedUsername");
        const savedPassword = localStorage.getItem("rememberedPassword");
        if (savedUsername && savedPassword) {
            setRememberMe(true);
        }
    }, []);

    const submitForm = async (
        prevState: FormState,
        formData: FormData,
    ): Promise<FormState> => {
        await new Promise((resolve) => setTimeout(resolve, 1500));

        const usernameOrEmail = formData.get("usernameOrEmail") as string;
        const password = formData.get("password") as string;
        const remember = formData.get("rememberMe") === "on";

        const errors: any = {};
        if (!usernameOrEmail) {
            errors.usernameOrEmail = ["Username or email is required"];
        }
        if (!password) {
            errors.password = ["Password is required"];
        }

        if (Object.keys(errors).length > 0) {
            return {
                success: false,
                message: "Please fix the errors below",
                errors,
            };
        }

        if (usernameOrEmail === "admin" && password === "admin123") {
            if (remember) {
                localStorage.setItem("rememberedUsername", usernameOrEmail);
                localStorage.setItem("rememberedPassword", password);
            } else {
                localStorage.removeItem("rememberedUsername");
                localStorage.removeItem("rememberedPassword");
            }

            return {
                success: true,
                message: "Login successful! Redirecting...",
            };
        }

        return {
            success: false,
            message: "Invalid username/email or password",
        };
    };

    const [state, formAction, isPending] = useActionState(submitForm, {
        success: false,
        message: "",
    });

    const handleSubmit = (formData: FormData) => {
        formAction(formData);
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{
                    backgroundImage: 'url("https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070&auto=format&fit=crop")',
                }}
            >
                {/* Dark/Light Overlay based on theme */}
                <div className={`absolute inset-0 ${theme === 'dark' ? 'bg-black/70' : 'bg-black/40'}`} />

                {/* Additional gradient overlay for glass effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20" />
            </div>

            {/* Glassmorphism Container */}
            <div className="relative z-10 w-full max-w-lg px-4">
                {/* Glassmorphic Panel */}
                <div className="backdrop-blur-xl  rounded-2xl shadow-2xl border border-white/20 p-4">
                    <Panel className="bg-transparent! shadow-none!"  >
                        <h1 className="mb-3 text-xl text-center text-white ">Log In</h1>
                        <form action={handleSubmit} className="space-y-6">
                            {state.success && (
                                <div className="flex items-center gap-2 p-3 bg-green-500/20 backdrop-blur-sm  text-green-100 rounded-lg">
                                    <CheckCircle className="w-5 h-5" />
                                    <span className="text-sm">{state.message}</span>
                                </div>
                            )}

                            {!state.success && state.message && (
                                <div className="p-3 bg-red-500/20 backdrop-blur-sm border border-red-500/30 text-red-100 rounded-lg text-sm">
                                    {state.message}
                                </div>
                            )}

                            <InputField
                                label="User name or Email"
                                inputClassName="text-white"
                                labelClassName='text-red-100'
                                name="usernameOrEmail"
                                type="text"
                                placeholder="admin"
                                error={state.errors?.usernameOrEmail?.[0]}
                                disabled={isPending}
                                isRequired
                                defaultValue={localStorage.getItem("rememberedUsername") || ""}
                            />

                            <div className="relative">
                                <InputField
                                    label="Password"
                                    inputClassName="text-white"
                                    labelClassName='text-red-100'
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    error={state.errors?.password?.[0]}
                                    disabled={isPending}
                                    isRequired
                                    defaultValue={localStorage.getItem("rememberedPassword") || ""}
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
                                    <span className="text-sm text-white/80">
                                        Remember me
                                    </span>
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
                                loading={isPending}
                                icon={<LogIn className="w-4 h-4" />}
                                className="bg-blue-600/80 hover:bg-blue-700/80 backdrop-blur-sm border border-blue-400/30"
                            >
                                {isPending ? "Logging in..." : "Login"}
                            </Button>

                            {/* <p className="text-xs text-center text-white/60">
                                Don't have an account?{" "}
                                <button
                                    type="button"
                                    className="text-blue-300 hover:text-blue-200 font-medium"
                                >
                                    Sign up
                                </button>
                            </p> */}
                        </form>
                      
                        <Dropdown
                          value={selectedCountry}
                          onChange={(e) => setSelectedCountry(e.value)}
                          options={countries}
                          optionLabel="name"
                          placeholder="Select a Country"
                          className="w-full"
                        />   
                    </Panel>
                </div>

                {/* Footer Note */}
                {/* <p className="text-center text-white/50 text-xs mt-6">
          Demo credentials: admin / admin123
        </p> */}
            </div>
        </div>
    );
};

export default Login;