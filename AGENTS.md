# TecnoFix - Agent Rules & Context

Bun monorepo architecture with strict separation of concerns and compile-time type safety.

## 👥 Project Scope
- **Name:** TecnoFix (SaaS PWA for technical repair management).
- **Core Workspace Layout:**
  - `apps/frontend` - React 19 + Vite + Tailwind (shadcn/ui style).
  - `apps/backend` - Elysia running natively on Bun.
  - `packages/schemas` - Shared TypeBox schemas (Single Source of Truth).

## 🚀 Workspace Commands
- **Install:** `bun install` (always run from root)
- **Run Frontend:** `bun --filter @tecnofix/frontend dev`
- **Run Backend:** `bun --filter @tecnofix/backend dev`
- **Lockfiles:** Bun only. Never generate `package-lock.json`, `yarn.lock`, or `pnpm-lock.yaml`.

## ⚙️ Code Style & Tooling
- **Formatter/Linter:** Biome (Tabs, double quotes, LF line endings).
- **TypeScript:** Strict mode enabled.
- **Paths:** Use absolute workspace resolution (e.g., `@serviceflow/backend/shared/result`).

## 🧠 Domain-Driven Design & Architecture Rules
We follow strict Clean Architecture. AI must respect these boundaries:

### 1. Shared Contracts (`packages/contracts`)
- All Request/Input validations must use TypeBox schemas here (e.g., `createOrderSchema`).
- Do NOT name these schemas as "Commands". They are DTO/Validation layers.

### 2. Domain Layer (`apps/backend/src/features/{module}/common/`)
- Entities (e.g., `Order`, `DeviceInfo`) must use private constructors and static factories (`create()`).
- All operations must return the `Result<T>` pattern. No raw exceptions for business logic.
- Domain Errors must be centralized in constants (e.g., `OrderErrors`, `DeviceInfoErrors`) with string codes like `DEVICE_BRAND_REQUIRED`.

### 3. Application Layer (`apps/backend/src/features/{module}/`)
- Use pure TypeScript interfaces for Commands (e.g., `CreateOrderCommand`) decoupled from TypeBox web constraints.

### 4. Infrastructure & Presentation Layer
- **Database:** Supabase/Postgres via Drizzle ORM.
- **Web:** Elysia framework. Connects frontend using Eden Client for E2E type safety.