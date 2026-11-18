import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Beta Power | إدارة الفواتير",
  description: "نظام إدارة وإنشاء الفواتير لشركة Beta Power",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ar" dir="rtl"><body>{children}<Toaster position="top-right" richColors closeButton dir="rtl"/></body></html>;
}
