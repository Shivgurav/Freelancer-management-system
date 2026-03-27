import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="font-display text-8xl font-bold text-primary/20 mb-4">404</div>
        <h1 className="font-display text-2xl font-bold text-ink mb-2">Page not found</h1>
        <p className="text-[14px] text-ink-3 mb-8">
          The page you're looking for doesn't exist.
        </p>
        <Link
          to="/"
          className="bg-primary hover:bg-primary-dark text-white rounded-xl py-3 px-7 text-[14px] font-semibold transition-all hover:shadow-md"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
