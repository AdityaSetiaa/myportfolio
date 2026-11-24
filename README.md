# Aditya Setia Portfolio

A Next.js 16 and React 19 portfolio with static, locally managed content.

## Run locally

Install dependencies with `bun install`, then start development with `bun run dev`. Run `bun run lint` and `bun run build` to validate a production build. Start the compiled site with `bun run start`.

## Customize

Edit `data/portfolio.ts` for project details, education, skills, contact details, and links. The resume and social links are intentionally unset until verified URLs or a PDF are supplied. Set `resumePath` to a PDF placed under `public` to display the download buttons.

The project visuals are CSS illustrations and can be replaced when authentic screenshots are available. Add a public site URL before configuring a canonical URL or sitemap.

## Portfolio companions

Click or keyboard-activate Mario or Steve to open their chat. Visitors can ask about the portfolio or call the other character. Mario's Arrow Up and Space controls still jump, and Steve's portal still starts his solo exploration.

Set `GROQ_API_KEY` in the server environment using [`.env.example`](.env.example) as a reference. The fast and reasoning model IDs can be configured with `GROQ_FAST_MODEL` and `GROQ_REASONING_MODEL`. Public facts come from `data/portfolio.ts` and the site profile, and scripted dialogue is available when Groq is unavailable. Voice and vision are disabled.

`GROQ_DAILY_LIMIT` defaults to 120 model requests per server process per UTC day. The endpoint also caps calls per visitor and applies a cooldown after a provider rate limit. The budgets live in process memory and reset on restart.
