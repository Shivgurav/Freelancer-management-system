import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Construction } from "lucide-react";

/**
 * Messages — Under Development
 * 
 * The Message Service has no backend routes yet (not registered in the API Gateway).
 * The UI is preserved here and will be wired up once the service is available.
 */
export default function Messages() {
  return (
    <DashboardLayout title="Messages">
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-warning-bg flex items-center justify-center mb-4">
          <Construction className="w-8 h-8 text-warning" />
        </div>
        <h2 className="font-display text-[20px] font-bold text-ink mb-2">Messages — Coming Soon</h2>
        <p className="text-[14px] text-ink-3 max-w-[380px] leading-relaxed">
          The messaging service is currently under development. You'll be able to chat
          directly with clients and freelancers here once it's ready.
        </p>
        <div className="mt-6 px-4 py-3 bg-warning-bg border border-warning/30 rounded-xl text-[13px] text-warning-text font-medium">
          🚧 Backend service not yet available
        </div>
      </div>
    </DashboardLayout>
  );
}
