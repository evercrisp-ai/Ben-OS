# Ben OS

> Personal Project Management System - An "Operating System for Life"

Ben OS is a Kanban-based project management environment optimized for human-AI collaboration. It enables management of personal tasks, side projects, client work, content creation, community building, and professional opportunities through a unified, intelligent interface.

## Features

- **Hierarchical Organization**: Areas → Projects → Milestones → Tasks → Subtasks
- **Kanban Boards**: Drag-and-drop task management with customizable columns
- **PRD Management**: Create and manage Product Requirement Documents
- **Progress Visualization**: Dashboards with burndown charts, velocity tracking, and more
- **AI Integration**: REST API and MCP Server for AI agent collaboration
- **Activity Logging**: Full audit trail for all system actions

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript (strict mode)
- **Database**: Supabase (PostgreSQL + Auth + Realtime)
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: Zustand + React Query
- **Drag & Drop**: @dnd-kit/core
- **Charts**: Recharts
- **Testing**: Vitest + React Testing Library

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or pnpm
- Supabase account (for database)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd ben-os
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
   SUPABASE_SERVICE_ROLE_KEY=xxx
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint errors |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check code formatting |
| `npm run test` | Run tests in watch mode |
| `npm run test:run` | Run tests once |
| `npm run test:coverage` | Run tests with coverage |
| `npm run type-check` | Check TypeScript types |

## Project Structure

```
ben-os/
├── src/
│   ├── app/              # Next.js App Router pages
│   ├── components/       # React components
│   │   ├── ui/           # shadcn/ui components
│   │   ├── layout/       # Layout components
│   │   ├── kanban/       # Kanban board components
│   │   ├── dashboard/    # Dashboard widgets
│   │   ├── prd/          # PRD editor components
│   │   ├── reports/      # Report components
│   │   └── shared/       # Shared components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility libraries
│   │   └── supabase/     # Supabase client
│   ├── stores/           # Zustand stores
│   └── types/            # TypeScript types
├── tests/                # Test files
│   ├── setup/            # Setup tests
│   ├── components/       # Component tests
│   ├── hooks/            # Hook tests
│   ├── api/              # API tests
│   └── e2e/              # End-to-end tests
├── supabase/             # Supabase configuration
│   └── migrations/       # Database migrations
└── public/               # Static assets
```

## Development

### Running Tests

```bash
# Run tests in watch mode
npm run test

# Run tests once
npm run test:run

# Run tests with coverage
npm run test:coverage
```

### Code Quality

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Check types
npm run type-check
```

## License

Private - All rights reserved.

## Author

Ben Cooper
