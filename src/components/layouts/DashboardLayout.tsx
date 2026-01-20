"use client";

import { ReactNode, useState, useEffect } from "react";
import { Sidebar } from "@/components/ui/Sidebar";

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
}

function CurrentDateTime() {
  const [dateTime, setDateTime] = useState<Date | null>(null);

  useEffect(() => {
    setDateTime(new Date());
    const interval = setInterval(() => {
      setDateTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!dateTime) return null;

  const formattedDate = dateTime.toLocaleDateString("en-SG", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const formattedTime = dateTime.toLocaleTimeString("en-SG", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="text-right">
      <p className="text-sm font-medium text-zinc-900
                    dark:text-zinc-100">
        {formattedTime}
      </p>
      <p className="text-xs text-zinc-500
                    dark:text-zinc-400">
        {formattedDate}
      </p>
    </div>
  );
}

export function DashboardLayout({ children, title, description }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="min-h-screen
                       lg:ml-64">
        <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/80 px-4 py-4 backdrop-blur
                          sm:px-6 sm:py-6
                          lg:px-8
                          dark:border-zinc-800 dark:bg-zinc-950/80">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* Hamburger menu - mobile only */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 lg:hidden
                           dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-semibold text-zinc-900
                               sm:text-2xl
                               dark:text-zinc-100">
                  {title}
                </h1>
                {description && (
                  <p className="mt-1 hidden text-sm text-zinc-500
                                sm:block
                                dark:text-zinc-400">
                    {description}
                  </p>
                )}
              </div>
            </div>
            <CurrentDateTime />
          </div>
        </header>
        <div className="p-4
                        sm:p-6
                        lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
