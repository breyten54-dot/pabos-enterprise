# PABOS Enterprise — Frontend

React 18 single-page application for the PABOS brokerage operating system.

## Stack

- React 18 + Vite + TypeScript
- Tailwind CSS
- TanStack Query
- React Router DOM
- React Hook Form + Zod
- Axios
- Lucide React

## Getting started

1. Copy the environment template:
   ```bash
   cp .env.example .env
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```

## Scripts

- `npm run dev` — start Vite dev server
- `npm run build` — TypeScript compile + Vite build
- `npm run lint` — run ESLint
- `npm run preview` — preview production build

## Environment variables

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | Base URL for the PABOS backend API |

## Notes

- Role-based route guards read permissions from the JWT payload or `/me` response.
- No real secrets are committed; use `.env` locally and never add it to version control.
