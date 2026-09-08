# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two primary audiences inside small and medium-sized companies that provide technical
repair and maintenance for copying/printing equipment (printers, photocopiers, MFPs):

1. **Technicians** — the primary operational users. They create and manage service
   orders while working with customer equipment, from mobile or desktop: recording the
   customer, device, reported issue, work performed, components and consumables used,
   and other relevant information.
2. **Billing and administrative staff** — they use technician-created service orders as
   the basis for quotations and invoices, and manage customers, devices, and other
   administrative information.

Workspace roles present in the code (`owner`/`admin`/`technician`/`viewer`) echo these
groups; the final role/permission semantics are still a product decision and should not
be treated as finalized.

## Product Purpose

A Spanish-language, multi-tenant SaaS for SMBs that repair and maintain printers,
photocopiers, and multifunction equipment. Each company manages its own technicians,
administrative users, customers, devices, consumables, and service orders. The service
order is the central artifact of the system, and its creation and management must be
extremely fast and straightforward — especially for technicians working on mobile. The
generated service-order PDF is an important workflow output because it can be delivered
to the customer.

## Positioning

Intended direction (owner-stated, not a proven market claim): a service-order-centered
tool whose greatest strength is speed of creating and advancing orders from a mobile
device, where each company is an isolated tenant with its own folio numbering and
identity, and where a polished, customer-ready PDF order document closes the workflow.

## Operating Context

- Technicians work at the point of service (customer premises or shop counter), primarily
  on phones/tablets but also desktops; admin staff work at a desk.
- The product is a mobile-first PWA, fully usable on desktop.
- Language: Spanish UI and domain vocabulary (e.g., order statuses `pendiente`,
  `entregada`, `cancelada`; `folio`; `observaciones`).
- The service-order document is an A4 PDF: company header/logo, folio, client, device
  (brand/model/serial and photo), components grouped into supplies, replacement parts,
  and others with quantities, technician, observations, and the client's signature.

## Capabilities and Constraints

### Product vision (intended direction)
- Extremely fast creation and management of service orders, mobile-first.
- A customer-ready PDF order document as the workflow output.
- Quotations and invoices built on technician-created service orders.
- Clear technician vs. billing/administrative staffing per company.
- Multi-tenant isolation per company, Spanish-first.

### Currently implemented (repository evidence — not final product commitments)
- Auth via Clerk; identity-backed users kept in sync.
- Company "workspace": create; per-shop alphabetic prefix used in folio counters;
  company profile (name/phone/email/address, optional logo via object storage); member
  roles; email invitations with accept/reject/cancel; paginated lists.
- Clients (name, phone, email, location; unique per workspace) and devices per client
  (serial, brand, model) with components (name, part number, type:
  supply/replacement_part/other).
- Service order: references client, device, and the user (technician) who creates it;
  observations; components; folio; statuses `pendiente` → `entregada`/`cancelada`;
  realtime notification on creation; one generated PDF per order (with device image and
  client signature) stored in object storage and retrievable by URL.
- Architecture: Bun monorepo. Backend = Elysia; domain uses private-constructor entities
  + `Result<T>`; shared TypeBox schemas in `packages/schemas`; Drizzle over Turso/libsql
  (SQLite) with migrations and seeds; Cloudflare R2 object storage; Resend email
  (react-email); WebSocket realtime. Frontend = React 19, Vite, Tailwind v4, TanStack
  Router/Query/Form, Clerk React, Eden treaty typed client; PWA configured.
- Frontend today is a scaffold: auth shell, `/login`, `/sign-up`, an empty authenticated
  home placeholder, and workspace data hooks only. No operational order/client/device
  screens are built yet.

### Planned (owner-stated, not yet implemented)
- Quotations and invoicing derived from service orders.
- Automatic delivery of the generated order document through email or phone/messaging
  channels.

### Open decisions
- Official product/brand name (see Brand Commitments).
- Final role/permission semantics beyond the two intended user groups.

## Brand Commitments

No final brand is committed. The current working/repository name is **ServiceFlow**
(README, `@serviceflow/*` package scope). **TecnoFix** is an earlier name and still
appears in AGENTS.md and as the email `appName` in backend wiring. Neither should be
treated as the final public brand. UI and product language are Spanish.

## Evidence on Hand

- Backend domain, routes, and tests: `apps/backend/src/features/{client,device,order,workspace,user}`
- Shared TypeBox schemas: `packages/schemas/src/{client,device,order,workspace,user}`
- DB migrations, schema, and seeds: `apps/backend/src/shared/database`
- Frontend scaffold: `apps/frontend` (auth shell, routing, workspace data hooks)
- Git history (recent): backend features built first, then frontend scaffolding.
- No real customers, testimonials, design assets, or public brand exist yet; nothing here
  should be fabricated or treated as customer-validated.

## Product Principles

1. The service order is the center of gravity; making it fast to create and manage from
   a phone is the measure of success.
2. The order PDF is a customer-facing deliverable and must carry the company's identity.
3. Mobile-first PWA that stays fully usable on desktop.
4. Each customer company is an isolated tenant whose identity (prefix, logo, company
   data) flows into its documents and folios.
5. Spanish-first; operational clarity over jargon.
