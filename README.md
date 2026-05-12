# cheapcarsus

A modern Next.js, TypeScript, and Tailwind used-car marketplace with:

- responsive home, inventory, detail, financing, sell, privacy, and terms pages
- custom searchable/filterable car inventory
- sold badges and condition pills for issues like not running, broken engine, tow away, or mechanic special
- private Supabase-backed inventory tools for adding cars and storing uploaded images
- Gemini image autofill for draft listing details
- seed inventory so the site works before Supabase is connected

## Run Locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Free Supabase Setup

1. Create a free account at `https://supabase.com`.
2. Click **New project**, choose the free plan, set a project name like `cheapcarsus`, and save the database password.
3. In Supabase, open **SQL Editor** and run `supabase/schema.sql` from this repository.
4. Open **Project Settings > API** and copy:
   - Project URL into `NEXT_PUBLIC_SUPABASE_URL`
   - anon public key into `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key into `SUPABASE_SERVICE_ROLE_KEY`
5. Keep `SUPABASE_BUCKET=cars`.
6. Set a long random `ADMIN_ACCESS_KEY` in `.env.local`. This key is required for private inventory tools and is checked on the admin page and server API routes.
7. Restart `npm run dev` after changing environment variables.

## Free Gemini API Setup

1. Go to `https://aistudio.google.com`.
2. Sign in with a Google account.
3. Open **Get API key** and create a free API key.
4. Add it to `.env.local` as `GEMINI_API_KEY`.
5. Keep `GEMINI_MODEL=gemini-2.0-flash`, or change it to another free Gemini model available in your Google AI Studio account.
6. Restart the dev server.

## Using Private Inventory Tools

1. Visit `/admin?key=YOUR_ADMIN_ACCESS_KEY`.
2. Keep that link private.
3. Upload a vehicle image.
4. Click **Autofill with Gemini** to draft title, make, model, condition, feature, and description fields.
5. Review and correct the fields. AI can make mistakes, especially with exact year, trim, VIN, mileage, and mechanical condition.
6. Add condition pills manually or with the suggested pill buttons.
7. Toggle **Available for sale / Marked sold** if the car should be listed as sold immediately.
8. Click **Save car**.

## Deployment Notes

Add the same environment variables in your hosting provider. For Vercel, use **Project Settings > Environment Variables** and redeploy.

Never expose `SUPABASE_SERVICE_ROLE_KEY` publicly. It belongs only in server environment variables.
