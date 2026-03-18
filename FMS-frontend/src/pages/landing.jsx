import { Link } from "react-router-dom";
import { ArrowRight, Briefcase, Search, Shield, Star, CheckCircle, Users, TrendingUp } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-ink">
      {/* Navbar */}
      <nav className="border-b border-border bg-surface/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center font-display font-extrabold text-[13px] text-white">
              TF
            </div>
            <span className="font-display font-bold text-base tracking-tight">TalentFlow</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-[13px] font-medium text-ink-2 hover:text-ink transition-colors px-4 py-2"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="bg-primary hover:bg-primary-dark text-white rounded-xl py-2 px-5 text-[13px] font-semibold transition-all hover:shadow-md"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden pt-20 pb-24 px-6">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-bg via-background to-[#ede9ff] pointer-events-none" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />

        <div className="max-w-3xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-primary-bg border border-primary-light rounded-full px-4 py-1.5 text-[12px] font-medium text-primary-dark mb-6">
            <Star className="w-3.5 h-3.5 fill-primary text-primary" />
            Trusted by 2,400+ clients and freelancers
          </div>

          <h1 className="font-display text-5xl sm:text-6xl font-bold text-ink leading-[1.1] tracking-tight mb-6">
            Where Great Work
            <span className="text-primary"> Gets Done</span>
          </h1>

          <p className="text-[17px] text-ink-3 leading-relaxed mb-10 max-w-xl mx-auto">
            TalentFlow connects skilled freelancers with forward-thinking clients. Post projects,
            submit proposals, and track progress — all in one streamlined platform.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/register"
              className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white rounded-xl py-3.5 px-7 text-[15px] font-semibold transition-all hover:shadow-lg hover:-translate-y-0.5 w-full sm:w-auto justify-center"
            >
              Start for Free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="flex items-center gap-2 border-2 border-border hover:border-primary-light bg-surface rounded-xl py-3.5 px-7 text-[15px] font-semibold text-ink-2 hover:text-primary-dark transition-all w-full sm:w-auto justify-center"
            >
              Browse Projects
            </Link>
          </div>

          {/* Stats row */}
          <div className="flex items-center justify-center gap-8 mt-14">
            {[
              { value: "2,400+", label: "Projects Posted" },
              { value: "1,200+", label: "Freelancers" },
              { value: "98%", label: "Satisfaction Rate" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="font-display text-2xl font-bold text-ink">{stat.value}</div>
                <div className="text-[12px] text-ink-3 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-surface border-y border-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold text-ink mb-3">
              Everything you need to get work done
            </h2>
            <p className="text-[15px] text-ink-3 max-w-md mx-auto">
              From finding talent to delivering results — TalentFlow handles every step.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: Briefcase,
                title: "Post Projects Instantly",
                desc: "Describe your project and receive proposals from top freelancers within hours.",
              },
              {
                icon: Users,
                title: "Find Verified Talent",
                desc: "Browse freelancers with verified ratings, reviews, and portfolios.",
              },
              {
                icon: TrendingUp,
                title: "Track Every Milestone",
                desc: "Monitor progress, share updates, and communicate all in one dashboard.",
              },
              {
                icon: Shield,
                title: "Safe & Transparent",
                desc: "Protected payments, clear timelines, and built-in dispute resolution.",
              },
            ].map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="bg-background border border-border rounded-2xl p-6 hover:shadow-md transition-shadow"
                >
                  <div className="w-10 h-10 bg-primary-bg rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-display text-[15px] font-semibold text-ink mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-[13px] text-ink-3 leading-relaxed">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold text-ink mb-3">How it works</h2>
            <p className="text-[15px] text-ink-3">Simple steps, powerful results.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* For Clients */}
            <div>
              <div className="text-[12px] font-semibold text-primary uppercase tracking-wider mb-4">
                For Clients
              </div>
              <div className="flex flex-col gap-4">
                {[
                  { step: 1, title: "Post your project", desc: "Describe what you need, set a budget and deadline." },
                  { step: 2, title: "Review proposals", desc: "Compare bids, check portfolios, and ask questions." },
                  { step: 3, title: "Track & pay", desc: "Monitor milestones and release payment on completion." },
                ].map((item) => (
                  <div key={item.step} className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full bg-primary text-white text-[13px] font-bold flex items-center justify-center flex-shrink-0">
                      {item.step}
                    </div>
                    <div>
                      <div className="font-semibold text-[14px] text-ink">{item.title}</div>
                      <div className="text-[13px] text-ink-3 mt-0.5">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* For Freelancers */}
            <div>
              <div className="text-[12px] font-semibold text-primary uppercase tracking-wider mb-4">
                For Freelancers
              </div>
              <div className="flex flex-col gap-4">
                {[
                  { step: 1, title: "Browse projects", desc: "Find work that matches your skills and interests." },
                  { step: 2, title: "Submit a proposal", desc: "Write a compelling cover letter and set your price." },
                  { step: 3, title: "Deliver & get paid", desc: "Complete the work and receive payment securely." },
                ].map((item) => (
                  <div key={item.step} className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full bg-primary text-white text-[13px] font-bold flex items-center justify-center flex-shrink-0">
                      {item.step}
                    </div>
                    <div>
                      <div className="font-semibold text-[14px] text-ink">{item.title}</div>
                      <div className="text-[13px] text-ink-3 mt-0.5">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-primary">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display text-3xl font-bold text-white mb-4">
            Ready to get started?
          </h2>
          <p className="text-primary-light text-[16px] mb-8">
            Join thousands of clients and freelancers already using TalentFlow.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/register"
              className="flex items-center gap-2 bg-white text-primary hover:bg-primary-bg rounded-xl py-3.5 px-7 text-[15px] font-semibold transition-all hover:shadow-lg w-full sm:w-auto justify-center"
            >
              Create Free Account <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="flex items-center gap-2 border-2 border-white/30 hover:border-white/60 text-white rounded-xl py-3.5 px-7 text-[15px] font-semibold transition-all w-full sm:w-auto justify-center"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border bg-surface">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded-lg flex items-center justify-center font-display font-extrabold text-[10px] text-white">
              TF
            </div>
            <span className="font-display font-bold text-sm text-ink">TalentFlow</span>
          </div>
          <p className="text-[12px] text-ink-4">
            © {new Date().getFullYear()} TalentFlow. All rights reserved.
          </p>
          <div className="flex items-center gap-1.5 text-[12px] text-success font-medium">
            <CheckCircle className="w-3.5 h-3.5" />
            All systems operational
          </div>
        </div>
      </footer>
    </div>
  );
}
