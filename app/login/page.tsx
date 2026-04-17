import { Suspense } from "react";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-10">
      <Suspense fallback={<div>Loading…</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
