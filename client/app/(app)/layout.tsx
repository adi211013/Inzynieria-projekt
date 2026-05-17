import Sidebar from "@/components/Sidebar";
import FAB from "../../components/FAB";
import BottomNav from "@/components/layout/BottomNav";
import { UserProvider } from "@/components/UserContext";
import { Toaster } from "@/components/ui/sonner";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <div className="flex h-screen overflow-hidden bg-bg">
        <Sidebar />
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">{children}</main>
        <FAB />
        <BottomNav />
        <Toaster position="top-center" />
      </div>
    </UserProvider>
  );
}