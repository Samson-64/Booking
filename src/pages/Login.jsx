import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth, apiErrorMessage } from "../auth/AuthContext";
import Button from "../components/Button";
import {
  // CalendarDays,
  KeyRound,
  Mail,
  User,
  ArrowRight,
  Eye,
  EyeOff,
} from "lucide-react";

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const from = location.state?.from?.pathname || "/";

  async function handleSubmit(e) {
    e?.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
      navigate(from, { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  function handleQuickLogin(quickEmail, quickPassword) {
    setEmail(quickEmail);
    setPassword(quickPassword);
    setMode("login");
    setError("");
  }

  return (
    <div className="flex min-h-screen items-center justify-center  px-4 py-12 selection:bg-teal-500 selection:text-white relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center">
          {/* <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-500 text-white shadow-xl shadow-teal-500/20 mb-4">
            <CalendarDays className="h-7 w-7" />
          </div> */}
          <h1 className="text-2xl font-bold tracking-tight  dark:text-black sm:text-3xl">
            Packing Portal
          </h1>
        </div>

        {/* Card */}
        <div className=" border border-slate-800 bg-slate-900/90 backdrop-blur-xl p-7 shadow-2xl shadow-black/40">
          {/* Mode Switcher Tabs */}
          <div className="mb-6 grid grid-cols-2 gap-1  bg-slate-950/80 p-1.5 border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError("");
              }}
              className={` py-2 text-xs font-semibold transition-all cursor-pointer ${
                mode === "login"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setError("");
              }}
              className={` py-2 text-xs font-semibold transition-all cursor-pointer ${
                mode === "register"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    id="name"
                    type="text"
                    placeholder="firstname lastname"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoComplete="name"
                    className="w-full border border-slate-700 bg-slate-950/60 pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  id="email"
                  type="email"
                  placeholder="name@organization.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full border border-slate-700 bg-slate-950/60 pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                Password
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  className="w-full border border-slate-700 bg-slate-950/60 pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs font-medium text-rose-400">
                {error}
              </div>
            )}

            <Button
              type="submit"
              loading={loading}
              variant="gradient"
              className="w-full justify-center py-2.5"
            >
              {mode === "login"
                ? "Sign In to Portal"
                : accountType === "specialist"
                ? "Create Provider Account"
                : "Create Account"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
