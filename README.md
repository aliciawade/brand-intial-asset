# Three paid schools

The Witch-Ology Institute, The Alchemy Institute, and EverGreen Soul-Path Navigation Institute are three public campuses built from one Next.js app. Each school has its own database, its own accounts, and its own Stripe subscriptions. A plan at one school does not open another.

There is no free campus. Welcome, Member Circle, Inner Circle, and Founder's Crown are all paid. Lesson text opens only while a subscription is active, and a higher level includes every course below it.

`campus/` is the app you edit. It is not published. `apps/witch-ology`, `apps/alchemy-institute`, and `apps/evergreen-path` are the three publishable copies. Each keeps its own `brand.config.ts`.

## Local preview

```bash
cd campus
npm install
npm test
npm run dev
```

The dev server uses an in-memory database when `DATABASE_URL` is unset. Billing then shows a local Member Circle preview so lessons can be read on this machine. That control is absent in production and whenever `DATABASE_URL` is set. Checkout stays closed until `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are present. Do not put those values in the repo.

The first admin visits `/admin/setup` while signed in and enters `ADMIN_SETUP_TOKEN`. That token is read from the environment and is not stored in the project.

## Sync and publish

After changing `campus/`, copy it into the three apps:

```bash
node scripts/sync-campus.mjs
```

The sync leaves each app's `brand.config.ts` in place. Publish each folder separately: `apps/witch-ology`, `apps/alchemy-institute`, and `apps/evergreen-path`. Learners need the public visibility, because these schools use their own accounts rather than Cursor team sign-in.
