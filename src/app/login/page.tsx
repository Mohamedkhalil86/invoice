"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, Mail } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const signIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);
    try {
      const { error: authError } = await getSupabaseBrowserClient().auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (authError) {
        setError(authError.message === "Invalid login credentials"
          ? "البريد الإلكتروني أو كلمة المرور غير صحيحة."
          : "تعذر تسجيل الدخول. تأكد من البيانات وحاول مرة أخرى.");
        return;
      }
      router.replace("/");
      router.refresh();
    } catch {
      setError("تعذر الاتصال بالخادم الآن. تحقق من اتصالك وحاول مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  return <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10" dir="rtl">
    <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-900/5 sm:p-9">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-teal-50 text-teal-700">
          <LockKeyhole size={25} aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">تسجيل الدخول</h1>
        <p className="mt-2 text-sm text-slate-500">Beta Power · إدارة الفواتير</p>
      </div>

      <form onSubmit={signIn} className="space-y-5">
        <label className="block text-sm font-bold text-slate-700">
          البريد الإلكتروني
          <span className="mt-2 flex h-12 items-center gap-3 rounded-xl border border-slate-300 px-3 text-slate-400 focus-within:border-teal-600 focus-within:ring-4 focus-within:ring-teal-600/10">
            <Mail size={18} aria-hidden="true" />
            <input
              className="h-full min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
              dir="ltr"
            />
          </span>
        </label>

        <label className="block text-sm font-bold text-slate-700">
          كلمة المرور
          <span className="mt-2 flex h-12 items-center gap-3 rounded-xl border border-slate-300 px-3 text-slate-400 focus-within:border-teal-600 focus-within:ring-4 focus-within:ring-teal-600/10">
            <LockKeyhole size={18} aria-hidden="true" />
            <input
              className="h-full min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="أدخل كلمة المرور"
            />
          </span>
        </label>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700" role="alert">{error}</p>}
        <button
          className="flex h-12 w-full items-center justify-center rounded-xl bg-teal-700 px-4 text-sm font-bold text-white transition hover:bg-teal-800 disabled:cursor-wait disabled:opacity-60"
          type="submit"
          disabled={loading}
        >
          {loading ? "جارٍ تسجيل الدخول..." : "تسجيل الدخول"}
        </button>
      </form>
    </section>
  </main>;
}
