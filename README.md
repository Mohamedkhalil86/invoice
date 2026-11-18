# Beta Power — Invoice Management

Arabic RTL invoice management app built with Next.js App Router, React, Tailwind CSS, Lucide, Supabase, and html2pdf.js.

## Run locally

1. Use Node.js 20 or newer.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local` and add your Supabase project URL and anon key.
4. Run the SQL in `supabase/schema.sql` in the Supabase SQL editor.
5. Run `npm run dev` and open `http://localhost:3000`.

Without Supabase environment variables, the app falls back to browser `localStorage`. Supabase stores and loads invoices live when configured. The supplied SQL policies are demo policies that allow unauthenticated access using the public anon key. Replace them with authenticated, user-scoped policies before storing sensitive or production invoices.

## Company logo

The provided JPEG at `src/WhatsApp Image 2026-11-18 at 3.39.14 PM.jpeg` is imported locally in `src/app/page.tsx` with a static Next.js image import. Replace that file or update the import to use another asset inside `src`. Next.js will bundle and optimize the static image.

## PDF sharing

`html2pdf.js` is dynamically imported in the browser when the user chooses WhatsApp sharing. The app creates an invoice PDF and uses `navigator.share` with the file when the browser supports file sharing. On browsers without file sharing, it downloads the PDF and opens WhatsApp with a prefilled message; the user attaches the downloaded PDF manually. WhatsApp's `wa.me` link cannot attach local files automatically. File sharing needs a secure context (HTTPS or localhost) and browser support.

## Database schema

The `public.invoices` table stores invoice rows and the item list as JSONB. See `supabase/schema.sql` for the schema and demo row policies.
