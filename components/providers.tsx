"use client";
// Force Webpack re-evaluation to pick up renamed auth-client.tsx

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { useState, Suspense } from "react";
import { AuthProvider } from "@/lib/auth-client";
import { PageTransitionLoader } from "@/components/shared/PageTransitionLoader";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            gcTime: 24 * 60 * 60 * 1000, // 24 hours
            staleTime: 10 * 60 * 1000, // 10 minutes
            retry: 1,
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: 0,
          },
        },
      })
  );

  const [persister] = useState(() => {
    if (typeof window !== "undefined") {
      return createSyncStoragePersister({ storage: window.localStorage });
    }
    return null;
  });

  const content = (
    <ThemeProvider
        attribute="class"
        defaultTheme="light"
        forcedTheme="light"
        disableTransitionOnChange={false}
      >
        <AuthProvider>
          <Suspense fallback={null}>
            <PageTransitionLoader />
          </Suspense>
          {children}
        </AuthProvider>
        <Toaster
          position="top-right"
          richColors
          closeButton
          duration={4000}
          toastOptions={{
            style: {
              fontFamily: "Inter, sans-serif",
              borderRadius: "12px",
            },
            classNames: {
              actionButton: "!bg-white !text-slate-900 hover:!bg-slate-50 !shadow-sm !font-semibold !px-3 !py-1.5 !rounded-lg !border !border-slate-200/50",
            },
          }}
        />
      </ThemeProvider>
  );

  if (persister) {
    return (
      <PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
        {content}
      </PersistQueryClientProvider>
    );
  }

  return <QueryClientProvider client={queryClient}>{content}</QueryClientProvider>;
}
