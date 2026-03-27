export function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-primary-bg via-background to-[#ede9ff]">
      {/* Background decorations */}
      <div className="absolute top-[-80px] right-[-80px] w-[400px] h-[400px] rounded-full bg-gradient-to-br from-primary/10 to-primary/5 pointer-events-none blur-2xl" />
      <div className="absolute bottom-[-60px] left-[-60px] w-[300px] h-[300px] rounded-full bg-gradient-to-tr from-primary/10 to-transparent pointer-events-none blur-2xl" />

      <div className="bg-surface border border-border rounded-[20px] w-full max-w-[440px] p-10 shadow-[0_20px_60px_rgba(100,87,224,0.08),0_4px_16px_rgba(0,0,0,0.04)] relative z-10 mx-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {children}
      </div>
    </div>
  );
}
