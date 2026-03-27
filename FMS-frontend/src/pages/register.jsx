import { useNavigate, Link } from "react-router-dom";
import { AuthLayout } from "@/components/layout/auth-layout";
import { useAppStore } from "@/store/use-app-store";
import { cn } from "@/lib/utils";
import { useState } from "react";

export default function Register() {
  const navigate = useNavigate();
  const { register, authLoading, authError } = useAppStore();
  const [selectedRole, setSelectedRole] = useState("CLIENT");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState("");

  async function handleRegister(e) {
    e.preventDefault();
    setLocalError("");
    if (!firstName.trim() || !lastName.trim()) {
      setLocalError("First name and last name are required.");
      return;
    }
    if (password.length < 6) {
      setLocalError("Password must be at least 6 characters.");
      return;
    }
    try {
      await register({ firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim(), password, role: selectedRole });
      navigate(`/dashboard/${selectedRole.toLowerCase()}`);
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
        <h2 className="font-display text-2xl font-bold text-ink mb-2">Create your account</h2>
        <p className="text-[13px] text-ink-3">Join thousands of clients and freelancers</p>
      </div>

      <div className="flex gap-2 mb-6">
        {["CLIENT", "FREELANCER"].map((role) => (
          <button
            key={role}
            type="button"
            onClick={() => setSelectedRole(role)}
            className={cn(
              "flex-1 py-2.5 rounded-lg text-[13px] font-medium transition-all border-[1.5px]",
              selectedRole === role
                ? "border-primary bg-primary-bg text-primary-dark"
                : "border-border text-ink-3 hover:border-border-2"
            )}
          >
            {role === "CLIENT" ? "◧ I'm a Client" : "◉ I'm a Freelancer"}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 bg-danger-bg border border-danger/30 text-danger-text rounded-xl px-4 py-3 text-[13px] font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleRegister} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[12.5px] font-medium text-ink-2 mb-1.5">First Name</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Alex"
              required
              className="w-full border-[1.5px] border-border rounded-lg px-3.5 py-2.5 text-[13.5px] text-ink bg-background focus:outline-none focus:border-primary focus:bg-surface focus:ring-4 focus:ring-primary/10 transition-all"
            />
          </div>
          <div>
            <label className="block text-[12.5px] font-medium text-ink-2 mb-1.5">Last Name</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Johnson"
              required
              className="w-full border-[1.5px] border-border rounded-lg px-3.5 py-2.5 text-[13.5px] text-ink bg-background focus:outline-none focus:border-primary focus:bg-surface focus:ring-4 focus:ring-primary/10 transition-all"
            />
          </div>
        </div>
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
            placeholder="At least 6 characters"
            required
            minLength={6}
            className="w-full border-[1.5px] border-border rounded-lg px-3.5 py-2.5 text-[13.5px] text-ink bg-background focus:outline-none focus:border-primary focus:bg-surface focus:ring-4 focus:ring-primary/10 transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={authLoading}
          className="bg-primary hover:bg-primary-dark disabled:opacity-60 text-white rounded-xl py-3 text-[14px] font-semibold transition-all hover:shadow-lg hover:-translate-y-0.5 mt-2"
        >
          {authLoading ? "Creating account..." : "Create Account"}
        </button>
      </form>

      <p className="text-center text-[13px] text-ink-3 mt-6">
        Already have an account?{" "}
        <Link to="/login" className="text-primary font-semibold hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
