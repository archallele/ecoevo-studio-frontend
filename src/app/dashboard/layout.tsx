import { SideNav } from "@/components/SideNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      <SideNav />
      <main className="ml-16 min-h-screen">
        {children}
      </main>
    </div>
  );
}
