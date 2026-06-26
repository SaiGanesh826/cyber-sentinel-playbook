import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AuthProvider } from "@/components/auth-provider";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="soc-card max-w-md p-8 text-center">
        <p className="chip">404 / NOT FOUND</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">Signal lost</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The route you're looking for is offline or never existed.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          Return to base
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="soc-card max-w-md p-8 text-center">
        <p className="chip chip-danger">SYSTEM ERROR</p>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">
          Something tripped a sensor
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We hit an unexpected condition. Try again, or return to the dashboard.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Retry
          </button>
          <a
            href="/"
            className="inline-flex items-center rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            Home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Nipun — Cybersecurity Awareness Training" },
      {
        name: "description",
        content:
          "Nipun internal cybersecurity awareness platform. Realistic phishing investigations in a virtual office environment.",
      },
      { name: "author", content: "Nipun" },
      { property: "og:title", content: "Nipun — Cybersecurity Awareness Training" },
      {
        property: "og:description",
        content:
          "Realistic phishing investigations, hidden scoring, and personalized learning reports for the workforce.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Nipun — Cybersecurity Awareness Training" },
      { name: "description", content: "SOC Defender is an enterprise cybersecurity awareness training platform that simulates realistic phishing incidents for employee education." },
      { property: "og:description", content: "SOC Defender is an enterprise cybersecurity awareness training platform that simulates realistic phishing incidents for employee education." },
      { name: "twitter:description", content: "SOC Defender is an enterprise cybersecurity awareness training platform that simulates realistic phishing incidents for employee education." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/c0b56fb3-58e7-45be-8f1d-3ee8409e18ac/id-preview-7fc65e84--195d1944-a0e1-4d20-a389-e68a50f5e73d.lovable.app-1782452765325.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/c0b56fb3-58e7-45be-8f1d-3ee8409e18ac/id-preview-7fc65e84--195d1944-a0e1-4d20-a389-e68a50f5e73d.lovable.app-1782452765325.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}


function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Outlet />
        <Toaster richColors position="top-right" />
      </AuthProvider>
    </QueryClientProvider>
  );
}

