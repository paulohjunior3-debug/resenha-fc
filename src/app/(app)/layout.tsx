import { getSessionProfile } from "@/lib/auth/session";
import { Header } from "@/components/layout/header";
import { BottomNav } from "@/components/layout/bottom-nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getSessionProfile();

  return (
    <div className="flex min-h-screen flex-col">
      <Header profile={profile} />
      <main className="flex-1 px-4 py-4">{children}</main>
      <BottomNav role={profile.role} />
    </div>
  );
}
