import { Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Topbar } from "./Topbar";
import { getDashboardMetrics } from "@/lib/api-client";

export function MainLayout() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const data = await getDashboardMetrics();
        setMetrics(data);
      } catch (error) {
        console.error("Failed to load global metrics:", error);
      }
    };
    loadMetrics();
    
    // Reload every 30 seconds
    const interval = setInterval(loadMetrics, 30000);
    return () => clearInterval(interval);
  }, [refreshKey]);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <Topbar onRefresh={handleRefresh} metrics={metrics} />
          <main className="flex-1 p-6 overflow-auto">
            <Outlet context={{ refreshKey, metrics }} />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
