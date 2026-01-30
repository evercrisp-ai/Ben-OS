# Agent Prompt Template for Ben OS Development

Use this template to start a new chat window for each PRD section.

---

## Standard Section Prompt

Copy and customize the following prompt for each section:

```
## Task Assignment

You are working on **Ben OS**, a personal project management system. 

**Your Assignment**: Section [X.X] - [SECTION NAME]

**Master PRD Location**: `BEN_OS_PRD.md` (read this first)

## Instructions

1. **Read the PRD** - Start by reading `BEN_OS_PRD.md`, specifically:
   - The "System Requirements" section for overall context
   - Section [X.X] for your specific requirements
   - Any prior sections if this section has dependencies

2. **Implement the Requirements** - Complete all requirements listed in Section [X.X]:
   - Follow the acceptance criteria exactly
   - Use the specified tech stack (Next.js 14+, TypeScript, Supabase, Tailwind, shadcn/ui)
   - Match the folder structure in Appendix B

3. **Write the Unit Tests** - Implement the unit tests specified in Section [X.X]
   - Tests should be in the `tests/` directory following the PRD structure
   - All tests must pass before marking complete

4. **Run Verification**:
   ```bash
   npm run lint
   npm run type-check
   npm run test
   npm run build
   ```

5. **Update the PRD** - When complete:
   - Check off items in the "Completion Checklist" for Section [X.X]
   - Add notes to "Section [X.X] Review Notes"
   - Update the "Progress Log" table with today's date and status
   - Update the "Agent Work Assignment" table with this chat's info

6. **Report Back** - Provide a summary of:
   - What was implemented
   - Files created/modified
   - Test results
   - Any issues encountered
   - Any deviations from the PRD (with justification)

## Important

- Do NOT modify sections outside your assignment without noting it
- If you discover issues with the PRD requirements, document them in review notes
- If blocked by a dependency, stop and report back
```

---

## Phase-Specific Prompts

### Phase 1.1 - Project Initialization

```
## Task Assignment

You are working on **Ben OS**, a personal project management system.

**Your Assignment**: Section 1.1 - Project Initialization

**Master PRD Location**: `BEN_OS_PRD.md`

## Instructions

1. Read `BEN_OS_PRD.md` Section 1.1 for all requirements (1.1.1 - 1.1.10)

2. Initialize the project:
   - Create Next.js 14+ project with App Router and TypeScript
   - Configure Tailwind CSS and shadcn/ui
   - Install all dependencies listed in the PRD tech stack
   - Set up Vitest for testing
   - Create the folder structure per Appendix B
   - Initialize Git repository

3. Write verification tests in `tests/setup/project-init.test.ts`

4. Run all verification commands and ensure they pass

5. Update the PRD:
   - Check off completion checklist items
   - Add review notes
   - Update progress log

6. Provide summary of what was created and any issues
```

### Phase 1.2 - Supabase Setup

```
## Task Assignment

You are working on **Ben OS**, a personal project management system.

**Your Assignment**: Section 1.2 - Supabase Setup & Database Schema

**Master PRD Location**: `BEN_OS_PRD.md`

**Dependency**: Section 1.1 must be complete

## Instructions

1. Read `BEN_OS_PRD.md` Section 1.2 for all requirements (1.2.1 - 1.2.15)

2. Set up Supabase:
   - Guide me through creating the Supabase project (I'll provide credentials)
   - Create `.env.local` with environment variables
   - Create migration file with full schema from PRD
   - Set up RLS policies
   - Create Supabase client utility
   - Generate TypeScript types from schema

3. Write database tests in `tests/database/schema.test.ts`

4. Run verification and ensure connection works

5. Update the PRD with completion status

6. Provide summary of database schema and any issues
```

### Phase 1.3 - Base UI Layout

```
## Task Assignment

You are working on **Ben OS**, a personal project management system.

**Your Assignment**: Section 1.3 - Base UI Layout

**Master PRD Location**: `BEN_OS_PRD.md`

**Dependency**: Sections 1.1 and 1.2 must be complete

## Instructions

1. Read `BEN_OS_PRD.md` Section 1.3 for all requirements (1.3.1 - 1.3.10)

2. Build the base UI:
   - Root layout with all providers (React Query, Theme, etc.)
   - Sidebar navigation component
   - Header with breadcrumbs
   - Dark/light mode with persistence
   - Command palette (Cmd+K)
   - Keyboard shortcuts system
   - Loading skeletons
   - Error boundaries
   - Toast notification system
   - Responsive layout

3. Write component tests in `tests/components/layout.test.tsx`

4. Verify the app runs and all UI elements work

5. Update the PRD with completion status

6. Provide summary with screenshots/descriptions of the UI
```

### [Continue pattern for remaining sections...]

---

## Quick Reference Commands

```bash
# Verification suite
npm run lint && npm run type-check && npm run test && npm run build

# Run specific test file
npm run test tests/[path-to-test].test.ts

# Start dev server
npm run dev
```

---

## Chat Window Naming Convention

For easy reference, name your chat windows:

- `BenOS-1.1-ProjectInit`
- `BenOS-1.2-Supabase`
- `BenOS-1.3-BaseUI`
- `BenOS-1.4-Kanban`
- `BenOS-1.5-CRUD`
- `BenOS-2.1-Milestones`
- etc.

This maps directly to the "Agent Work Assignment" table in the PRD.

---

## After Each Section

After completing a section, verify:

1. [ ] All unit tests pass
2. [ ] No TypeScript errors
3. [ ] No ESLint errors
4. [ ] Build succeeds
5. [ ] PRD updated with completion status
6. [ ] Progress log entry added

## After Each Phase

After completing all sections in a phase, run the Phase Review:

1. [ ] Execute full test suite
2. [ ] Complete manual testing checklist
3. [ ] Fill in Phase Review Notes in PRD
4. [ ] Verify no regressions from previous phases
