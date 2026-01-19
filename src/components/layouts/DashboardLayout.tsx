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
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <Sidebar />
      <main className="ml-64 min-h-screen">
        <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/80 px-8 py-6 backdrop-blur
                          dark:border-zinc-800 dark:bg-zinc-950/80">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-zinc-900
                             dark:text-zinc-100">
                {title}
              </h1>
              {description && (
                <p className="mt-1 text-sm text-zinc-500
                              dark:text-zinc-400">
                  {description}
                </p>
              )}
            </div>
            <CurrentDateTime />
          </div>
        </header>
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
