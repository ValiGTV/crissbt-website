# React + Vite

## Reviews system setup

1. Apply `supabase/migrations/202607160001_create_reviews.sql` to the Supabase project.
2. Enable the Google provider in Supabase Authentication and configure its Google OAuth credentials.
3. Configure the server-only variables listed in `.env.example` in Vercel. `REVIEWS_ADMIN_EMAILS` accepts a comma-separated allowlist.
4. Deploy through Vercel so the functions under `/api` are available. The moderation UI is intentionally unlinked and lives at `/admin/reviews`.

The Supabase Secret key (`sb_secret_...`) is used only by server functions and must never be exposed as a `VITE_` variable. Public approved-review reads use the Publishable key (`sb_publishable_...`) plus RLS. Submissions are validated and inserted as pending by one transaction-safe RPC that also enforces three attempts per salted IP hash per rolling hour. Each invocation deletes at most 500 rate records older than 24 hours.

Supabase API keys are opaque and are sent only through the `apikey` header. They are never used as bearer tokens. `Authorization: Bearer ...` is reserved exclusively for an actual authenticated-user access-token JWT when validating an administrator session.

### Supabase Auth redirect URLs

Add these URLs to the Supabase Auth redirect allowlist before testing Google login:

- `http://localhost:5173/api/admin/oauth/callback`
- `https://crissbt.com/api/admin/oauth/callback`
- `https://www.crissbt.com/api/admin/oauth/callback`
- `https://*-<your-vercel-team-or-account>.vercel.app/api/admin/oauth/callback` for Vercel previews; replace the placeholder with the actual Vercel scope.

The OAuth callback restores the PKCE session server-side, verifies that Google is the identity provider, then checks the Google email against the comma-separated server-only `REVIEWS_ADMIN_EMAILS` allowlist. The browser receives only an HttpOnly session cookie.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
