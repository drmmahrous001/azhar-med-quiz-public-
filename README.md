# Azhar Med Quiz — Public Copy

This repository is an **independent copy** of the application source, created separately from the private production repository. The original repository remains unchanged and private.

## What is included

- Next.js / React application pages and reusable UI components
- Quiz, study, progress, and practical-study interface code
- Project configuration and dependency lockfile
- Empty sample data files so private question content is not published

## What is intentionally excluded

- Real question banks, exam papers, answer keys, and study datasets
- Extracted book text and OSCE/practical image collections
- The bundled offline HTML application, which may contain embedded course content
- Admin and AI API routes pending server-side authorization and abuse protection review
- Production secrets, credentials, and private student information

## Current status

This is a sanitized source-code copy, **not yet a verified production-ready release**. Some features that depend on excluded data, assets, or API routes will not work until they are rebuilt with cleared content and secured backend endpoints.

## Development

Requirements: Node.js and pnpm.

```bash
pnpm install
pnpm dev
```

Before deploying, configure only the environment variables required by the secured backend. Never commit real secrets.

## Public release checklist

- Confirm redistribution rights for every asset and dependency.
- Add server-side admin authentication before restoring admin functionality.
- Add rate limits, request-size limits, and validation to AI endpoints.
- Verify Supabase row-level security and RPC permissions before enabling device sync.
- Run type checks, production build, dependency audit, and secret scanning.
- Replace the empty sample datasets only with content explicitly cleared for public release.
