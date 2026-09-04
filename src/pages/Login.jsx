import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth, apiErrorMessage } from "../auth/AuthContext";
import Button from "../components/Button";
import {
  ArrowRight,
  BriefcaseBusiness,
  Eye,
  EyeOff,
  PackageCheck,
  User,
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
    "w-full border-0 border-b border-slate-300 bg-transparent px-0 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-800 focus:ring-0";
  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError("");
  };

  return (
    <main className="min-h-screen bg-[#dce9f5] p-3 selection:bg-blue-200 selection:text-blue-950 sm:p-6 lg:p-8">
      <div className="mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-6xl overflow-hidden rounded-[1.8rem] border-[14px] border-[#071827] bg-[#eef5fc] shadow-2xl shadow-slate-950/30 sm:min-h-[calc(100vh-3rem)] lg:grid-cols-[1fr_1.18fr] lg:rounded-[2rem]">
        <section className="relative z-10 flex items-center justify-center bg-[#eef5fc] px-6 py-12 sm:px-12 lg:px-14 lg:py-16">
          <div className="w-full max-w-md">
            <div className="mb-10 flex items-center gap-2.5 text-2xl font-bold tracking-tight text-[#102c67]">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#2dd4bf] text-[#102c67] shadow-sm">
                <PackageCheck className="h-5 w-5" />
              </div>
              Booking Portal
            </div>
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight text-[#102c67] sm:text-[2.1rem]">
                {mode === "login" ? "Welcome Back" : "Create your account"}
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {mode === "login"
                  ? "Sign in to continue to your workspace."
                  : "Start organising your work in just a few moment."}
              </p>
            </div>
            <div
              className="mb-8 grid grid-cols-2 border-b border-slate-200"
              role="tablist"
              aria-label="Authentication mode"
            >
              {[
                ["login", "Sign In"],
                ["register", "Create account"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={mode === value}
                  onClick={() => switchMode(value)}
                  className={`border-b-2 px-3 py-3 text-sm font-semibold transition ${mode === value ? "border-[#173486] text-[#173486]" : "border-transparent text-slate-400 hover:text-slate-700"}`}
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
                  detail="Booking Service"
                />
                <AccountType
                  active={accountType === "specialist"}
                  onClick={() => {
                    setAccountType("specialist");
                    setError("");
                  }}
                  icon={<BriefcaseBusiness className="h-4 w-4" />}
                  title="Provider"
                  detail="Offer Service"
                />
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "register" && (
                <Field label="Full Name">
                  <input
                    id="name"
                    type="text"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoComplete="name"
                    className={inputClass}
                  />
                </Field>
              )}
              {mode === "register" && accountType === "specialist" && (
                <Field label="Position or specification">
                  <input
                    id="position"
                    type="text"
                    placeholder="Consultant, trainer, technician"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    required
                    autoComplete="organization-title"
                    className={inputClass}
                  />
                </Field>
              )}
              <Field label="Email address">
                <input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className={inputClass}
                />
              </Field>
              <Field label="password">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  className={`${inputClass} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-slate-700"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </Field>
              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
                >
                  {error}
                </div>
              )}
              <Button
                type="submit"
                loading={loading}
                variant="primary"
                className="mt-4 w-full justify-center rounded-md bg-[#172f89] py-3.5 text-sm shadow-lg shadow-blue-950/15 hover:bg-[#10256e]"
              >
                {mode === "login"
                  ? "Sign In"
                  : accountType === "specialist"
                    ? "Create provider Account"
                    : "Create account"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
            <p className="mt-7 text-center text-xs leading-5 text-slate-400">
              By continuuing, you agree to use the portal responsibly
            </p>
          </div>
        </section>
        <section
          aria-label="Espacio de trabajo"
          className="relative hidden min-h-[520px] overflow-hidden bg-[#062b5e] lg:block"
        >
          <div className="absolute inset-0 bg-[linear-gradient(90deg,#062b5e_0%,rgba(6,43,94,.72)_13%,rgba(6,43,94,.18)_42%,rgba(4,25,55,.35)_100%),url('https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1400&q=85')] bg-cover bg-center" />
          <div className="absolute inset-y-0 -left-20 w-44 -skew-x-8 bg-[#eef5fc]" />
          <div className="absolute bottom-12 left-16 max-w-xs text-white">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[.22em] text-cyan-200">
              Your space, your reservations
            </p>
            <p className="text-2xl font-semibold leading-tight">
              Everything you need to work better.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

function Field({ label, icon, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-slate-500">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
          {icon}
        </span>
        {children}
      </div>
    </div>
  );
}
function AccountType({ active, onClick, icon, title, detail }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border p-3 text-left transition ${active ? "border-teal-500 bg-teal-50 ring-1 ring-teal-500" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"}`}
    >
      <span
        className={`mb-2 grid h-7 w-7 place-items-center rounded-lg ${active ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-500"}`}
      >
        {icon}
      </span>
      <span className="block text-sm font-semibold text-slate-800">
        {title}
      </span>
      <span className="mt-0.5 block text-xs text-slate-500">{detail}</span>
    </button>
  );
}
