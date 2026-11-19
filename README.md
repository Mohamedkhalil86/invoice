# Beta Power — Invoice Management

Arabic RTL invoice management app built with Next.js App Router, React, Tailwind CSS, Lucide, Supabase, and html2pdf.js.

## Run locally

1. Use Node.js 20 or newer.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local` and add your Supabase project URL and anon key.
4. Run the SQL in `supabase/schema.sql` in the Supabase SQL editor.
5. Run `npm run dev` and open `http://localhost:3000`.

## Authentication and access

The app has a sign-in page only; there is no public sign-up flow. Create allowed accounts from Supabase Dashboard → Authentication → Users, then disable **Allow new users to sign up** in the Supabase Auth settings. This project setting is required to prevent new accounts from being created through the Supabase Auth API directly.

Run the updated `supabase/schema.sql` in the Supabase SQL Editor to remove the demo anonymous policies and grant invoice access only to authenticated sessions. Apply it to existing projects as well as new ones. All authenticated users share the same invoice list. Configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env.local` for local development and in the deployment environment.

## Company logo

The provided JPEG at `src/WhatsApp Image 2026-11-18 at 3.39.14 PM.jpeg` is imported locally in `src/app/page.tsx` with a static Next.js image import. Replace that file or update the import to use another asset inside `src`. Next.js will bundle and optimize the static image.

## PDF sharing

`html2pdf.js` is dynamically imported in the browser when the user chooses WhatsApp sharing. The app creates an invoice PDF and uses `navigator.share` with the file when the browser supports file sharing. On browsers without file sharing, it downloads the PDF and opens WhatsApp with a prefilled message; the user attaches the downloaded PDF manually. WhatsApp's `wa.me` link cannot attach local files automatically. File sharing needs a secure context (HTTPS or localhost) and browser support.

## Database schema

The `public.invoices` table stores invoice rows and the item list as JSONB. `supabase/schema.sql` enables authenticated-only row policies.
