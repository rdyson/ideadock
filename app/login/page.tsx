import { Suspense } from "react";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <Suspense fallback={<div>Loading…</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
