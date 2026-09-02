import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth, apiErrorMessage } from "../auth/AuthContext";
import Button from "../components/Button";
import {
  ArrowRight,
  BriefcaseBusiness,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
  PackageCheck,
  User,
  Users,
} from "lucide-react";

export default function Login() {
  const { login, register, registerSpecialist } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState("login");
  const [accountType, setAccountType] = useState("client");
  const [name, setName] = useState("");
  const [position, setPosition] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const from = location.state?.from?.pathname || "/";

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") await login(email, password);
      else if (accountType === "specialist")
        await registerSpecialist(name, email, password, position);
      else await register(name, email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10";
  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError("");
  };

  return (
    <main className="min-h-screen bg-slate-50 p-4 selection:bg-teal-100 selection:text-teal-950 sm:p-6 lg:p-8">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-6xl overflow-hidden rounded-[2rem] bg-white shadow-2xl shadow-slate-900/10 lg:grid-cols-[1.04fr_.96fr]">
        <section className="relative hidden overflow-hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(45,212,191,.26),transparent_30%),radial-gradient(circle_at_84%_82%,rgba(99,102,241,.28),transparent_34%)]" />
          <div className="relative flex items-center mt-25 ml-[15%] gap-3 text-[50px] font-bold tracking-tight">
            Booking Portal
          </div>
          <div className="relative  max-w-md py-16">
            <p className="mb-5 text-sm font-semibold uppercase tracking-[.2em] text-teal-300">
              Work, organized
            </p>
            <h1 className="text-4xl font-semibold leading-tight tracking-tight">
              Everything your team needs, all in one place.
            </h1>
            <p className="mt-5 text-base leading-7 text-slate-300">
              Coordinate requests, appointments, and spaces without the
              back-and-forth.
            </p>
            <ul className="mt-10 space-y-4 text-sm text-slate-200">
              {[
                "Simple booking management",
                "Real-time appointment updates",
                "Built for teams and providers",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-teal-400/15 text-teal-300">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <p className="relative text-xs text-slate-500">
            © {new Date().getFullYear()} Booking Portal
          </p>
        </section>
        <section className="flex items-center justify-center px-5 py-10 sm:px-10 lg:px-14">
          <div className="w-full max-w-md">
            <div className="mb-8 lg:hidden">
              <div className="mb-5 grid h-11 w-11 place-items-center rounded-xl bg-teal-600 text-white">
                <PackageCheck className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold text-teal-700">
                Booking Portal
              </p>
            </div>
            <div className="mb-7">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                {mode === "login" ? "Welcome back" : "Create your account"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {mode === "login"
                  ? "Sign in to continue to your workspace."
                  : "Start organizing your work in just a few moments."}
              </p>
            </div>
            <div
              className="mb-7 grid grid-cols-2 rounded-xl bg-slate-100 p-1"
              role="tablist"
              aria-label="Authentication mode"
            >
              {[
                ["login", "Sign in"],
                ["register", "Create account"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={mode === value}
                  onClick={() => switchMode(value)}
                  className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition ${mode === value ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                >
                  {label}
                </button>
              ))}
            </div>
            {mode === "register" && (
              <div className="mb-6 grid grid-cols-2 gap-3">
                <AccountType
                  active={accountType === "client"}
                  onClick={() => {
                    setAccountType("client");
                    setPosition("");
                    setError("");
                  }}
                  icon={<User className="h-4 w-4" />}
                  title="Client"
                  detail="Book services"
                />
                <AccountType
                  active={accountType === "specialist"}
                  onClick={() => {
                    setAccountType("specialist");
                    setError("");
                  }}
                  icon={<BriefcaseBusiness className="h-4 w-4" />}
                  title="Provider"
                  detail="Offer services"
                />
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "register" && (
                <Field label="Full name" icon={<User className="h-4 w-4" />}>
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

            {mode === "register" && accountType === "specialist" && (
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                  Position / Specialty
                </label>
                <div className="relative">
                  <Users className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    id="position"
                    type="text"
                    placeholder="e.g. Consultant, Trainer, Technician"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    required
                    autoComplete="organization-title"
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
