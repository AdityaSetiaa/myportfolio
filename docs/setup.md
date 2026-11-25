# Portfolio setup

A Next.js 16 and React 19 portfolio with a private MongoDB-backed content editor.

## Run locally

Install dependencies with `bun install`, then start development with `bun run dev`. Run `bun run lint` and `bun run build` to validate a production build. Start the compiled site with `bun run start`.

## Customize

Use `/admin` to edit projects, sections, resume and social links. The original content remains in `data/portfolio.ts` and `data/cms-seed.ts` for first-time seeding and local use without MongoDB.

The original project illustrations are CSS. Upload a screenshot in Media and select it as the project thumbnail to replace an illustration.

## Portfolio companions

Mario and Steve explore and react through animation. Walking, collision detection, solo mining, and greetings run locally. Each tab can see one call per character and makes at most one optional planner request.

Set `GROQ_API_KEY` in the server environment to enable occasional contextual action selection and Steve’s cherry leaf observations with `openai/gpt-oss-20b`. The action planner returns one allowlisted action. The leaf endpoint returns one short line and the browser tries it at most twice per tab session. Both have local fallbacks.

`GROQ_DAILY_LIMIT` defaults to 60 requests per server process per UTC day, with a maximum of 120. The planner also allows one in-flight request, waits at least 15 seconds between requests, and applies a cooldown after a provider rate limit. These limits reset on restart.

## Content management

Set `MONGODB_URI` to your MongoDB Atlas URI and set `MONGODB_DB` if the URI does not name the intended database. The existing `MONGO_URI` variable is also accepted. Without a database connection configured, the public site uses the original local content. With Atlas configured, run `bun run cms:migrate` to copy that content into MongoDB. Running it again preserves existing edits and slugs. During a connection outage, the public site uses the last published content read by its server process or the original portfolio content on a cold start. The CMS and media authorization require a live connection.

Set `AUTH_SECRET` to a securely generated random value. On an HTTPS deployment, set `AUTH_URL` and `PUBLIC_SITE_URL` to the public origin. Provision the single administrator from a protected local terminal. The password must be at least 16 characters.

```bash
read -r -p 'Administrator email: ' ADMIN_EMAIL
read -r -s -p 'Administrator password: ' ADMIN_PASSWORD
printf '\n'
ADMIN_EMAIL="$ADMIN_EMAIL" ADMIN_PASSWORD="$ADMIN_PASSWORD" bun run cms:admin
unset ADMIN_EMAIL ADMIN_PASSWORD
```

The setup skips an existing administrator. Use `bun run cms:admin --replace` only to replace that account and revoke its old sessions. Keep setup credentials out of deployment secrets after provisioning.

Sign in at `/login`. Drafts stay private, and the editor previews section and case-study changes as you type. Publishing updates the public pages and makes changed content eligible for Mario Spotlight. Revisions records publications and restores. Archived projects can be recovered there. Old published project URLs redirect to the current slug.

To enable media, provide either `CLOUDINARY_URL` or the three Cloudinary fields in `.env.example`. Uploads use authenticated Cloudinary assets, and portfolio URLs serve them publicly only while referenced by published content. To replace a file, upload its replacement and select it in the editor. Previous files remain available to revisions.

## Mario Spotlight

Publishing changed content in a section or project makes it eligible for a Mario spotlight visit for 72 hours. Updates from the past 24 hours have first priority. The dashboard shows eligibility and expiration times. Each browser tab can see up to two spotlight visits per session, and Mario only chooses platforms in view. A project that is absent from the homepage can still have a spotlight on the project index.

Set the eligibility and priority windows with `MARIO_SPOTLIGHT_HOURS` and `MARIO_SPOTLIGHT_FRESH_HOURS`. Set the visible visit length with `MARIO_SPOTLIGHT_VISIT_MIN_SECONDS` and `MARIO_SPOTLIGHT_VISIT_MAX_SECONDS`. The browser checks a small metadata feed every 45 seconds by default. Change the interval with `MARIO_SPOTLIGHT_POLL_SECONDS`.
