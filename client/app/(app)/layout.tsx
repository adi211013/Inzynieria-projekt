import Sidebar from "@/components/Sidebar";
import FAB from "../../components/FAB";
import { UserProvider } from "@/components/UserContext";
import { Toaster } from "@/components/ui/sonner";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <div className="flex min-h-screen bg-bg">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">{children}</main>
        <FAB />
        <Toaster position="top-center" />
      </div>
    </UserProvider>
  );
}
