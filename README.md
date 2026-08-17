# Build Your Own Hero

Peptide evidence guide + training/nutrition plan builder, with a bespoke
AI-generated plan behind a (currently simulated) premium tier.

## Run it locally

```bash
npm install
npm run dev
```

Then open the local URL it prints (usually `http://localhost:5173`).

## What's inside

- `src/App.jsx` — the whole app (evidence tiers, quick plan builder, bespoke
  plan builder that calls the Claude API)
- `src/assets/` — logo SVGs (icon-only and full lockup)
- `public/favicon.svg` — browser tab icon
- Tailwind + Vite for styling and build tooling

## Before this goes live

1. **Deploy the code.** Push this folder to GitHub, then connect it to
   [Vercel](https://vercel.com) or [Netlify](https://netlify.com) — both
   auto-detect Vite and deploy in a couple of clicks.
2. **Real accounts + billing.** The "Simulate premium unlock" button in the
   Bespoke plan tab is a placeholder. Wire up
   [Memberstack](https://memberstack.com) + Stripe (or your preferred
   auth/billing stack) and swap the `isPremium` state in `src/App.jsx` for a
   real subscription check.
3. **API key handling.** The bespoke plan generator calls
   `https://api.anthropic.com/v1/messages` directly from the browser with no
   key — that only works inside Claude's artifact environment. For a real
   deployment, move that call to a small backend/serverless function that
   holds your Anthropic API key, and have the frontend call your backend
   instead.
4. **Clinical review.** The evidence-tier content is a starting point, not a
   finished clinical reference — have it reviewed before it's patient-facing.
5. **Free-text fields.** The bespoke intake avoids medical-history questions
   by design, but people can still type health details into the free-text
   fields. Decide how those are stored/handled before this collects real
   user data.
