# NexaGram — setup guide

This is the first real full-stack starter for NexaGram. It includes a responsive white social feed, Supabase email/password authentication, profile records, posts, likes, comments, follows/messages/notifications database tables, and starter Row Level Security policies.

## 1. Install tools
- Install Node.js LTS from https://nodejs.org/
- Install Visual Studio Code from https://code.visualstudio.com/
- Extract this ZIP to a folder such as `Documents/NexaGram`.

## 2. Create Supabase project
With a parent/guardian helping with the cloud account:
1. Open https://supabase.com/ and create a project.
2. Save the database password privately. Never paste it into chat or website code.
3. In Project Settings → API, copy the Project URL and the public anon/publishable key.
4. In Supabase → SQL Editor, open `supabase/schema.sql`, paste the full contents and click Run.
5. In Authentication → Providers, ensure Email is enabled. For a public launch, configure email confirmation and abuse protections.

## 3. Add local environment values
1. Copy `.env.example` and rename the copy to `.env.local`.
2. Put your Project URL after `NEXT_PUBLIC_SUPABASE_URL=`.
3. Put only the public anon/publishable key after `NEXT_PUBLIC_SUPABASE_ANON_KEY=`.
4. Do not put a `service_role` key, database password, or any secret key in `.env.local` or frontend code.

## 4. Run the website
Open this folder in VS Code. Open Terminal → New Terminal and run:

```bash
npm install
npm run dev
```

Open http://localhost:3000 in your browser.

## 5. Test
- Open `/signup`, create a test account using an email you can access.
- Confirm the email if Supabase asks.
- Log in at `/login`.
- Create a text post from the Home page.
- Test Like and Comments.

## 6. Publish later
When local testing works, deploy the project to a hosting provider such as Vercel. Add the same two public environment variables in the hosting project's Environment Variables. Ask a parent/guardian to review billing, privacy, and account settings before publishing.

## Important current limitations
This is a working foundation, not a finished production social network. The first UI has a basic text post and optional image URL field. Secure media upload, story/reel creation, full messaging screens, follow controls, notifications UI, privacy settings, content reporting/moderation, rate limits, account deletion, and production security review still need implementation and testing before public launch. Do not invite the public until those are completed.

## Safety and privacy checklist before public launch
- Add image/video uploads through a private storage bucket and validated file rules.
- Add block/report tools and a moderation/admin workflow.
- Add spam/rate limiting and account recovery.
- Review database policies and test with multiple separate accounts.
- Add privacy policy, terms, contact/support process, and age-appropriate safeguards.
- Never collect unnecessary personal information.
