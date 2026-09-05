# Urban Furniture Accounting System - Tasks

## Phase 1: Project Architecture & Foundation
- `[/]` Initialize Git repository
- `[ ]` Scaffold Backend (`server` directory with Express, Prisma, MySQL, JS)
- `[ ]` Scaffold Frontend (`client` directory with Vite, React, JS, Tailwind)
- `[x]` Create Prisma Schema (`schema.prisma`) based on the PRD
- `[x]` Set up database connection and migrations
- `[x]` Implement Backend Authentication (JWT, bcrypt, User/Role models)
- `[x]` Implement Frontend Authentication (Context, Axios, Login page, Protected routes)
- `[x]` Set up base UI layout (Sidebar, Topbar, Odoo theme)

## Phase 2: Master Data
- `[x]` Contacts CRUD (Backend + Frontend)
- `[x]` Product Categories CRUD (Backend + Frontend)
- `[x]` Products CRUD (Backend + Frontend)
- `[x]` Chart of Accounts CRUD (Backend + Frontend)
- `[x]` Journals CRUD (Backend + Frontend)
- `[x]` Analytic Accounts CRUD (Backend + Frontend)

## Phase 3: Accounting Engine
- `[x]` Accounting Service (double-entry logic, debit=credit validation)
- `[x]` Journal Entries API & UI
- `[x]` General Ledger UI

## Phase 4: Purchases
- `[x]` Purchase Orders API & UI
- `[x]` Vendor Bills API & UI
- `[x]` Bill Payments (Backend integration with accounting engine)

## Phase 5: Sales
- `[x]` Sales Orders API & UI
- `[x]` Customer Invoices API & UI
- `[x]` Invoice Payments (Backend integration with accounting engine)

## Phase 6: Budgets
- `[x]` Budgets API & UI
- `[x]` Budget calculation logic (Planned vs Committed vs Achieved)

## Phase 7: Reports
- `[x]` Balance Sheet Report
- `[x]` Profit & Loss Report
- `[x]` Budget Report

## Phase 8: Dashboard Analytics
- `[x]` Analytics APIs
- `[x]` Dashboard UI (Charts, KPIs)

## Phase 9: OCR (Vendor Bills / Invoices)
- `[x]` OCR Service integration
- `[x]` Upload & Extract UI

## Phase 10: PDF Generation
- `[x]` PDF templates and generation logic

## Phase 11: Testing & Polishing
- `[x]` Database Seeding
- `[x]` E2E flow testing
- `[x]` Responsive Design refinements
