# MPK Dashboard

A freight forwarding management dashboard built with Next.js, featuring authentication, client management, shipment tracking, and settings management.

## Tech Stack

- **Framework**: Next.js 16
- **Authentication**: Better Auth
- **Database**: PostgreSQL with Drizzle ORM
- **UI Components**: shadcn/ui (Base UI)
- **Styling**: Tailwind CSS
- **Validation**: Zod
- **Forms**: React Hook Form

## Features

- Client management
- Batch tracking
- Air & sea shipments
- Price rates configuration
- Exchange rates management

## Getting Started

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database

```bash
# Generate migrations
npm run db:generate

# Push schema to database
npm run db:push

# Run migrations
npm run db:migrate
```

## Development

```bash
# Lint
npm run lint

# Format code
npm run format

# Check and fix issues
npm run check
```
