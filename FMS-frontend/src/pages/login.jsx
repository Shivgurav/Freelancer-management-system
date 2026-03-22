import { useNavigate, Link } from "react-router-dom";
import { AuthLayout } from "@/components/layout/auth-layout";
import { useAppStore } from "@/store/use-app-store";
import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Login() {
  const navigate = useNavigate();
  const { login, authLoading, authError } = useAppStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [localError, setLocalError] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setLocalError("");
    try {
      const { role } = await login({ email: email.trim(), password });
      // Role from backend is uppercase: CLIENT or FREELANCER
      const dashRole = (role || "CLIENT").toLowerCase();
      navigate(`/dashboard/${dashRole}`);
    } catch (err) {
      setLocalError(err.message);
    }
  }

  const error = localError || authError;

  return (
    <AuthLayout>
      <div className="flex items-center gap-3 justify-center mb-8">
        <div className="w-[38px] h-[38px] bg-primary rounded-xl flex items-center justify-center font-display font-extrabold text-[15px] text-white">
          TF
        </div>
        <span className="font-display font-bold text-[22px] text-ink">TalentFlow</span>
      </div>

      <div className="text-center mb-7">
        <h2 className="font-display text-2xl font-bold text-ink mb-2">Welcome back</h2>
        <p className="text-[13px] text-ink-3">Sign in to your account to continue</p>
      </div>

      {error && (
        <div className="mb-4 bg-danger-bg border border-danger/30 text-danger-text rounded-xl px-4 py-3 text-[13px] font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <div>
          <label className="block text-[12.5px] font-medium text-ink-2 mb-1.5">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="w-full border-[1.5px] border-border rounded-lg px-3.5 py-2.5 text-[13.5px] text-ink bg-background focus:outline-none focus:border-primary focus:bg-surface focus:ring-4 focus:ring-primary/10 transition-all"
          />
        </div>
        <div>
          <label className="block text-[12.5px] font-medium text-ink-2 mb-1.5">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            required
            className="w-full border-[1.5px] border-border rounded-lg px-3.5 py-2.5 text-[13.5px] text-ink bg-background focus:outline-none focus:border-primary focus:bg-surface focus:ring-4 focus:ring-primary/10 transition-all"
          />
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setRemember(!remember)}
            className="flex items-center gap-2 text-[12.5px] text-ink-2"
          >
            <div className={cn("w-4 h-4 rounded border-[1.5px] flex items-center justify-center transition-all", remember ? "bg-primary border-primary" : "border-border")}>
              {remember && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
            </div>
            Remember me
          </button>
        </div>

        <button
          type="submit"
          disabled={authLoading}
          className="bg-primary hover:bg-primary-dark disabled:opacity-60 text-white rounded-xl py-3 text-[14px] font-semibold transition-all hover:shadow-lg hover:-translate-y-0.5 mt-2"
        >
          {authLoading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <p className="text-center text-[13px] text-ink-3 mt-6">
        Don&apos;t have an account?{" "}
        <Link to="/register" className="text-primary font-semibold hover:underline">
          Sign up
        </Link>
      </p>
    </AuthLayout>
  );
}
