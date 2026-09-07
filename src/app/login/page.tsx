import { Suspense } from "react";
import { Wordmark } from "@/components/site/SiteChrome";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Admin sign in — RohtreMedia" };

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-mist px-5">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <Wordmark />
          <p className="eyebrow mt-4">Admin</p>
          <h1 className="mt-1 text-xl font-display text-ink-soft">Sign in</h1>
          <span className="rule rule-center mt-3" />
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
