# FlowBoard

Modern project management for engineering teams.

## Stack

- Next.js, React, TypeScript, and Tailwind CSS
- Prisma ORM with PostgreSQL on Neon
- Vercel for deployments

## Local development

Install dependencies:

```bash
npm install
```

Copy the environment template and add your Neon connection string:

```bash
cp .env.example .env.local
```

Generate the Prisma client and start the app:

```bash
npm run db:generate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Pooled PostgreSQL connection string used by Prisma |

Never commit `.env.local`. Add the same variable to the Production, Preview, and Development environments in Vercel.
