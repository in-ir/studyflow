"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Mail, Lock, User, CreditCard, Eye, EyeOff, AlertCircle } from "lucide-react";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
    student_id: "",
  });

  const [errors, setErrors] = useState({
    email: "",
    student_id: "",
    password: "",
  });

  const validateEmail = (email: string): boolean => {
    if (!email.endsWith("@uottawa.ca")) {
      setErrors((prev) => ({
        ...prev,
        email: "Please use your uOttawa email (@uottawa.ca)",
      }));
      return false;
    }
    setErrors((prev) => ({ ...prev, email: "" }));
    return true;
  };

  const validateStudentId = (id: string): boolean => {
    if (id && !/^\d{9}$/.test(id)) {
      setErrors((prev) => ({
        ...prev,
        student_id: "Student ID must be exactly 9 digits",
      }));
      return false;
    }
    setErrors((prev) => ({ ...prev, student_id: "" }));
    return true;
  };

  const validatePassword = (password: string): boolean => {
    if (password.length < 6) {
      setErrors((prev) => ({
        ...prev,
        password: "Password must be at least 6 characters",
      }));
      return false;
    }
    setErrors((prev) => ({ ...prev, password: "" }));
    return true;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Real-time validation
    if (name === "email") validateEmail(value);
    if (name === "student_id") validateStudentId(value);
    if (name === "password") validatePassword(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    // Validate before submit
    if (!isLogin) {
      if (
        !validateEmail(formData.email) ||
        !validatePassword(formData.password) ||
        !validateStudentId(formData.student_id)
      ) {
        setLoading(false);
        return;
      }
    } else {
      if (
        !validateEmail(formData.email) ||
        !validatePassword(formData.password)
      ) {
        setLoading(false);
        return;
      }
    }

    try {
      const endpoint = isLogin ? "/auth/login" : "/auth/register";
      const payload = isLogin
        ? { email: formData.email, password: formData.password }
        : formData;

      const response = await fetch(`http://localhost:8000${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("auth_token", data.access_token);
        localStorage.setItem("auth_user", JSON.stringify(data.user));

        setMessage({
          type: "success",
          text: `Welcome ${data.user.full_name}!`,
        });

        setTimeout(() => router.push("/"), 1000);
      } else {
        setMessage({
          type: "error",
          text: data.detail || `${isLogin ? "Login" : "Registration"} failed`,
        });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "Network error. Please check if the backend is running.",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setFormData({ email: "", password: "", full_name: "", student_id: "" });
    setErrors({ email: "", student_id: "", password: "" });
    setMessage({ type: "", text: "" });
  };

  return (
    <>
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=Crimson+Pro:wght@300;400;500;600;700&display=swap");

        .font-serif {
          font-family: "Crimson Pro", "Georgia", serif;
        }
      `}</style>

      <div className="min-h-screen bg-black flex items-center justify-center p-4 font-serif">
        <div className="max-w-md w-full">
          {/* Logo */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-xl mb-6 border border-white/20 backdrop-blur-xl">
              <BookOpen size={32} className="text-white" />
            </div>
            <h1 className="text-5xl font-semibold mb-3 tracking-tight">
              StudyFlow
            </h1>
            <p className="text-gray-400 text-lg">University of Ottawa</p>
          </div>

          {/* Auth Card */}
          <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-8 mb-6">
            <div className="mb-8">
              <h2 className="text-3xl font-semibold mb-2">
                {isLogin ? "Welcome back" : "Create account"}
              </h2>
              <p className="text-gray-400">
                {isLogin
                  ? "Sign in to continue your learning journey"
                  : "Join StudyFlow to manage your courses"}
              </p>
            </div>

            {message.text && (
              <div
                className={`flex items-start gap-3 p-4 rounded-lg mb-6 border ${
                  message.type === "success"
                    ? "bg-green-500/10 border-green-500/20 text-green-400"
                    : "bg-red-500/10 border-red-500/20 text-red-400"
                }`}
              >
                <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                <span className="text-sm">{message.text}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User
                      size={18}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500"
                    />
                    <input
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 transition-all"
                      placeholder="Enter your full name"
                      required={!isLogin}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  uOttawa Email
                </label>
                <div className="relative">
                  <Mail
                    size={18}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500"
                  />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full pl-12 pr-4 py-3.5 bg-white/5 border ${
                      errors.email ? "border-red-500/50" : "border-white/10"
                    } rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 ${
                      errors.email
                        ? "focus:ring-red-500/20"
                        : "focus:ring-white/20"
                    } focus:border-white/20 transition-all`}
                    placeholder="your.name@uottawa.ca"
                    required
                  />
                </div>
                {errors.email && (
                  <p className="text-red-400 text-xs mt-2 flex items-center gap-1">
                    <AlertCircle size={12} />
                    {errors.email}
                  </p>
                )}
              </div>

              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Student ID <span className="text-gray-500">(Optional)</span>
                  </label>
                  <div className="relative">
                    <CreditCard
                      size={18}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500"
                    />
                    <input
                      type="text"
                      name="student_id"
                      value={formData.student_id}
                      onChange={handleInputChange}
                      maxLength={9}
                      className={`w-full pl-12 pr-4 py-3.5 bg-white/5 border ${
                        errors.student_id
                          ? "border-red-500/50"
                          : "border-white/10"
                      } rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 ${
                        errors.student_id
                          ? "focus:ring-red-500/20"
                          : "focus:ring-white/20"
                      } focus:border-white/20 transition-all`}
                      placeholder="300123456"
                    />
                  </div>
                  {errors.student_id && (
                    <p className="text-red-400 text-xs mt-2 flex items-center gap-1">
                      <AlertCircle size={12} />
                      {errors.student_id}
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock
                    size={18}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500"
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`w-full pl-12 pr-12 py-3.5 bg-white/5 border ${
                      errors.password ? "border-red-500/50" : "border-white/10"
                    } rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 ${
                      errors.password
                        ? "focus:ring-red-500/20"
                        : "focus:ring-white/20"
                    } focus:border-white/20 transition-all`}
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-400 text-xs mt-2 flex items-center gap-1">
                    <AlertCircle size={12} />
                    {errors.password}
                  </p>
                )}
                {isLogin && (
                  <div className="text-right mt-2">
                    <button
                      type="button"
                      className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      Forgot your password?
                    </button>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-white/10 hover:bg-white/20 text-white py-4 rounded-lg font-medium transition-all border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] mt-8"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>
                      {isLogin ? "Signing in..." : "Creating account..."}
                    </span>
                  </div>
                ) : (
                  <span>{isLogin ? "Sign in" : "Create account"}</span>
                )}
              </button>
            </form>
          </div>

          {/* Toggle Mode */}
          <div className="text-center">
            <p className="text-gray-400 text-sm">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                onClick={toggleMode}
                className="text-white font-medium hover:underline transition-all"
              >
                {isLogin ? "Sign up" : "Sign in"}
              </button>
            </p>
          </div>

          {/* Footer Info */}
          <div className="mt-8 text-center">
            <p className="text-gray-500 text-xs">
              For uOttawa students only • Secure authentication
            </p>
          </div>
        </div>
      </div>
    </>
  );
}