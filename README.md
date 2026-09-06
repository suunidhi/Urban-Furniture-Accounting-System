# 🪑 Urban Furniture Accounting System

**A production-grade, double-entry accounting platform built for a furniture enterprise — inspired by Odoo's accounting suite.**

Urban Furniture Accounting System is a full-stack ERP-style web application that manages the complete financial lifecycle of a business: purchases, sales, ledgers, budgets, and financial reporting — all enforced by real double-entry bookkeeping rules.

<p>
  <img alt="Node.js" src="https://img.shields.io/badge/Backend-Express%20%2B%20TypeScript-000000?logo=express">
  <img alt="React" src="https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-61DAFB?logo=react&logoColor=black">
  <img alt="Prisma" src="https://img.shields.io/badge/ORM-Prisma-2D3748?logo=prisma">
  <img alt="MySQL" src="https://img.shields.io/badge/Database-MySQL%208-4479A1?logo=mysql&logoColor=white">
  <img alt="License" src="https://img.shields.io/badge/License-ISC-blue">
</p>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [System Architecture](#-system-architecture)
- [Database Schema (ER Diagram)](#-database-schema-er-diagram)
- [Core Accounting Logic](#-core-accounting-logic)
- [User Roles & Permissions](#-user-roles--permissions)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Available Scripts](#-available-scripts)
- [Demo Walkthrough](#-demo-walkthrough)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🧭 Overview

Urban Furniture needed to replace manual/spreadsheet-based bookkeeping with a real enterprise accounting system — one that behaves like an internal ERP module rather than a simple expense tracker. This project delivers exactly that:

- **Real double-entry ledger accounting** — every transaction is enforced to balance (`Σ Debit == Σ Credit`) inside atomic database transactions.
- **End-to-end Purchase & Sales lifecycles** — from Purchase/Sales Orders → Bills/Invoices → Payments → Journal Entries → Ledger.
- **Interactive budgeting** with revision history, variance tracking, and achievement percentages.
- **OCR-assisted bill/invoice creation** — upload a scanned document and get a pre-filled, editable draft.
- **Role-based access control** for Admins, Accountants, and self-service Contact (customer/vendor) users.
- **Real-time financial reports** — Balance Sheet, P&L, Trial Balance, General Ledger, Aging reports, and more.

It is designed and structured the way a real accounting SaaS product (like Odoo Accounting or Zoho Books) would be — not a toy CRUD app.

---

## ✨ Key Features

### 🔐 Authentication & User Management
- JWT-based authentication with bcrypt password hashing
- Role-based route guards (`ADMIN`, `ACCOUNTANT`, `CONTACT_USER`)
- Sign up, login, forgot/reset password, user creation by admins

### 📊 Dashboard & Accounting Overview
- Configurable date-range filters (Today, Week, Month, Quarter, Year, Custom)
- KPI cards: Sales, Purchases, Receivables, Payables, Net Profit, Cash, Bank, Budget Utilization
- Visual analytics: Revenue vs Expenses, Sales Trends, Aging Breakdown, Top Products/Partners (via Recharts)

### 🗂️ Master Data Management
| Module | Description |
|---|---|
| **Contacts** | Customers, Vendors, or both — with auto-provisioned self-service portal accounts |
| **Products** | Goods, Services, or Combos with pricing, cost, and category |
| **Product Categories** | Hierarchical categorization with inline creation |
| **Chart of Accounts** | Assets, Liabilities, Equity, Income, Expenses — parent-child hierarchy with live balances |
| **Journals** | Sales, Purchase, Bank, Cash, and General journals with default account mapping |
| **Analytic Accounts** | Cost-center / project tagging for budgeting and reporting |
| **Budgets** | Planned vs Committed vs Achieved tracking with a full revision workflow |

### 🛒 Purchase Lifecycle
Purchase Order → Vendor Bill → Payment → Journal Entry → Ledger
- Auto-sequenced document numbers (`P00001`, `Bill/2026/0001`)
- OCR-assisted bill creation from scanned/uploaded documents

### 💰 Sales Lifecycle
Sales Order → Customer Invoice → Payment → Journal Entry → Ledger
- Auto-sequenced document numbers (`S00001`, `INV/2026/0001`)
- Customer self-service portal with a simulated "Pay Now" flow

### 🧾 Payments & Allocations
- Unified payment registration for both receivables and payables
- Automatic status updates: `Unpaid` → `Partially Paid` → `Paid` / `Overdue`

### 📚 Double-Entry Accounting Engine
- Every Bill, Invoice, and Payment automatically generates a **balanced Journal Entry**
- Enforced atomically via `prisma.$transaction`
- Full audit trail linking source documents to ledger postings

### 📈 Financial & Analytical Reports
- Balance Sheet · Profit & Loss · Trial Balance · General Ledger
- Aged Receivables & Payables (Current, 1–30, 31–60, 61–90, 90+ days)
- Budget Reports · Sales & Purchase Analytics · Product/Stock Activity

### 🧠 OCR Bill/Invoice Assistant
- Upload PDF/image documents
- Heuristic/regex extraction of vendor, invoice #, dates, line items, and totals
- Editable side-by-side review before draft creation — **never auto-posts**

### 🖨️ Document Export
- Print-ready and PDF-exportable invoices, bills, and financial statements

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, React Router v6, TanStack Query, Axios, Recharts, Lucide Icons |
| **Backend** | Node.js, Express.js, TypeScript (modular `routes/ → controllers/ → services/ → validators/`) |
| **Database** | MySQL 8.0 |
| **ORM** | Prisma ORM (`@prisma/client`) with relational migrations & seed scripts |
| **Auth** | JWT (Bearer tokens) + bcrypt password hashing |
| **OCR** | Pluggable `OCRService` interface (regex/heuristic parsing; swappable with Google Vision / Tesseract / Mindee) |
| **Precision** | `Prisma.Decimal` / MySQL `DECIMAL(15,2)` for all monetary values — no floating-point drift |

> 💡 **Why this stack?** Prisma + MySQL gives strict relational integrity for financial data (critical for accounting), while a TypeScript backend keeps ledger logic type-safe. The frontend is intentionally desktop-first and Odoo-inspired, since accounting/ERP tools are primarily used on larger screens.

---

## 🏗️ System Architecture

The application follows a classic **three-tier monorepo architecture**, with a strict separation between presentation, business logic, and data persistence — plus a pluggable OCR subsystem sitting alongside the core purchase/sales flow.

```mermaid
flowchart TB
    subgraph Client["🖥️ Frontend — React + Vite + Tailwind"]
        UI[Pages & Feature Modules]
        RQ[TanStack Query Cache]
        AX[Axios API Client]
        UI --> RQ --> AX
    end

    subgraph API["⚙️ Backend — Express + TypeScript"]
        MW[Auth / RBAC Middleware]
        RT[Routes]
        CT[Controllers]
        SV[Services — Business & Accounting Logic]
        VA[Validators]
        RT --> MW --> CT --> VA
        CT --> SV
    end

    subgraph Data["🗄️ Data Layer"]
        PR[Prisma ORM]
        DB[(MySQL 8 — urban_furniture_db)]
        PR --> DB
    end

    subgraph OCR["🧠 OCR Assistant"]
        OCRSVC[OCRService Interface]
        PARSE[Regex / Heuristic Parser]
        OCRSVC --> PARSE
    end

    AX -- "HTTPS / JWT Bearer" --> RT
    SV --> PR
    SV -. "Draft Bill/Invoice" .-> OCRSVC

    classDef client fill:#017E84,color:#fff,stroke:#014f52
    classDef api fill:#714B67,color:#fff,stroke:#4a2f44
    classDef data fill:#8F8F8F,color:#fff,stroke:#5c5c5c
    classDef ocr fill:#c98b3f,color:#fff,stroke:#8a5d26
    class Client client
    class API api
    class Data data
    class OCR ocr
```

### Request Lifecycle
1. **Frontend** dispatches an API call via Axios, attaching a `Bearer <JWT>` token.
2. **Middleware** validates the token and enforces role-based access (`ADMIN` / `ACCOUNTANT` / `CONTACT_USER`).
3. **Controller** delegates business logic to a **Service**, which performs the actual accounting operations.
4. For posting operations (Bills, Invoices, Payments), the **Service** wraps the entire operation — document update → Journal Entry creation → Journal Items → Ledger sync — inside a single **Prisma atomic transaction**, guaranteeing debits and credits never go out of sync.
5. **Prisma** persists changes to **MySQL**, and the response flows back up through the same layers.

### End-to-End Business Flow

```mermaid
flowchart LR
    PO[Purchase Order] -- Convert --> VB[Vendor Bill]
    VB -- Post --> JE1[Journal Entry]
    JE1 --> PAY1[Register Payment]

    SO[Sales Order] -- Convert --> CI[Customer Invoice]
    CI -- Post --> JE2[Journal Entry]
    JE2 --> PAY2[Receive Payment]

    JE1 & JE2 --> LEDGER[(General Ledger)]
    LEDGER --> REPORTS[Balance Sheet / P&L / Trial Balance]

    style LEDGER fill:#714B67,color:#fff
    style REPORTS fill:#017E84,color:#fff
```

---

## 🗃️ Database Schema (ER Diagram)

```mermaid
erDiagram
    User ||--o{ Contact : creates
    Role ||--o{ User : assigns
    Contact ||--o| User : has_portal_account
    Contact ||--o{ PurchaseOrder : vendor
    Contact ||--o{ SalesOrder : customer
    Contact ||--o{ VendorBill : vendor
    Contact ||--o{ CustomerInvoice : customer
    Contact ||--o{ Payment : partner

    ProductCategory ||--o{ Product : categorizes
    Product ||--o{ PurchaseOrderLine : includes
    Product ||--o{ SalesOrderLine : includes
    Product ||--o{ VendorBillLine : includes
    Product ||--o{ CustomerInvoiceLine : includes

    Account ||--o{ Account : parent_child
    Account ||--o{ Journal : default_accounts
    Account ||--o{ JournalItem : posts_to

    Journal ||--o{ JournalEntry : contains
    JournalEntry ||--|{ JournalItem : has_lines

    AnalyticAccount ||--o{ Budget : plans
    AnalyticAccount ||--o{ VendorBillLine : tracks
    AnalyticAccount ||--o{ CustomerInvoiceLine : tracks
    AnalyticAccount ||--o{ JournalItem : tags

    PurchaseOrder ||--o{ PurchaseOrderLine : contains
    PurchaseOrder ||--o| VendorBill : converts_to

    SalesOrder ||--o{ SalesOrderLine : contains
    SalesOrder ||--o| CustomerInvoice : converts_to

    VendorBill ||--o{ VendorBillLine : contains
    VendorBill ||--o| JournalEntry : creates
    VendorBill ||--o{ PaymentAllocation : pays

    CustomerInvoice ||--o{ CustomerInvoiceLine : contains
    CustomerInvoice ||--o| JournalEntry : creates
    CustomerInvoice ||--o{ PaymentAllocation : pays

    Payment ||--o{ PaymentAllocation : allocates
    Payment ||--o| JournalEntry : creates

    Budget ||--o| Budget : revision_of
```

---

## 🧮 Core Accounting Logic

Every transaction ultimately reduces to balanced journal postings. Here's what happens under the hood:

### Purchase Flow — Vendor Bill (Total ₹35,400, Tax ₹5,400)
| Account | Debit | Credit |
|---|---|---|
| Purchase Expense A/c | ₹30,000 | |
| Input Tax / Tax Paid A/c | ₹5,400 | |
| Creditors / Accounts Payable A/c | | ₹35,400 |

**Vendor Payment (via Bank):** Debit Creditors ₹35,400 → Credit Bank ₹35,400

### Sales Flow — Customer Invoice (Total ₹29,500, 18% Tax ₹4,500)
| Account | Debit | Credit |
|---|---|---|
| Debtors / Accounts Receivable A/c | ₹29,500 | |
| Sales Income A/c | | ₹25,000 |
| Tax Payable A/c | | ₹4,500 |

**Customer Payment (via Cash/Bank):** Debit Cash/Bank ₹29,500 → Credit Debtors ₹29,500

### Budget Formulas
```
Achieved %        = (Achieved Amount / Committed Amount) × 100
Amount to Achieve = Committed Amount − Achieved Amount
```
- **Committed** = sum of posted vendor bill lines tagged to an Analytic Account within the period
- **Achieved** = sum of journal item amounts tagged to that Analytic Account within the period
- **Revision** = a confirmed budget becomes `REVISED`; a new linked budget is created with a `"Revised"` suffix, bidirectionally cross-referenced

> ⚖️ **Consistency guarantee:** No document is ever marked "Posted" unless `Σ Debit == Σ Credit` for its generated Journal Entry — this check happens inside the same atomic transaction as the ledger write.

---

## 👥 User Roles & Permissions

| Module / Action | Admin / Owner | Accountant | Contact User |
|---|:---:|:---:|:---:|
| Manage Users & Settings | ✅ Full | ❌ | ❌ |
| Master Data (CRUD/Archive) | ✅ Full | ✅ Full | ❌ |
| Purchase Orders & Bills | ✅ Full | ✅ Full | 👁️ Own bills only |
| Sales Orders & Invoices | ✅ Full | ✅ Full | 👁️ Own invoices only |
| Register/Record Payments | ✅ Full | ✅ Full | 💳 Pay own docs |
| Journal Entries & Posting | ✅ Full | ✅ Full | ❌ |
| Budgets & Revisions | ✅ Full | ✅ Full | ❌ |
| Company Financial Reports | ✅ Full | ✅ Full | ❌ |
| Customer Portal | ✅ Full | ✅ Full | ✅ Dedicated portal only |

---

## 📁 Project Structure

```
Urban-Furniture-Accounting-System/
├── package.json                 # Root workspace scripts
├── .env.example
├── prisma/
│   ├── schema.prisma             # All models, enums, relations, indexes
│   └── seed.ts                   # Default CoA, journals, demo users/contacts/products
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── server.ts
│       ├── app.ts
│       ├── config/
│       ├── middleware/           # JWT auth, RBAC guards
│       ├── routes/
│       ├── controllers/
│       ├── services/             # Accounting & business logic (transactional)
│       ├── validators/
│       └── utils/
└── frontend/
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    ├── index.html
    └── src/
        ├── App.tsx
        ├── main.tsx
        ├── router.tsx
        ├── components/
        │   ├── layout/
        │   ├── ui/
        │   └── common/
        ├── features/
        │   ├── auth/
        │   ├── dashboard/
        │   ├── contacts/
        │   ├── products/
        │   ├── accounts/
        │   ├── journals/
        │   ├── purchases/
        │   ├── sales/
        │   ├── budgets/
        │   ├── payments/
        │   ├── ocr/
        │   └── reports/
        ├── services/
        └── types/
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18+ and npm
- **MySQL 8.0** running locally or remotely
- Git

### 1. Clone the repository
```bash
git clone https://github.com/suunidhi/Urban-Furniture-Accounting-System.git
cd Urban-Furniture-Accounting-System
```

### 2. Configure environment variables
```bash
cp .env.example .env
```
Update `.env` with your MySQL connection string and JWT secret (see [Environment Variables](#-environment-variables)).

### 3. Install dependencies
```bash
npm install
npm --prefix backend install
npm --prefix frontend install
```

### 4. Set up the database
```bash
npm run prisma:generate   # Generate Prisma client
npm run prisma:push       # Push schema to MySQL
npm run prisma:seed       # Seed demo data (Chart of Accounts, users, contacts, products)
```

### 5. Run the app in development
```bash
npm run dev:backend     # Starts the Express API
npm run dev:frontend    # Starts the Vite dev server
```

The frontend will typically be available at `http://localhost:5173` and the API at `http://localhost:5000` (confirm actual ports in each package's config).

---

## 🔧 Environment Variables

Set these in your `.env` file (see `.env.example` for the full list):

| Variable | Description |
|---|---|
| `DATABASE_URL` | MySQL connection string, e.g. `mysql://root:password@localhost:3306/urban_furniture_db` |
| `JWT_SECRET` | Secret key used to sign/verify JWT tokens |
| `PORT` | Backend server port |
| `NODE_ENV` | `development` / `production` |

> 🔒 **Security note:** Never commit real credentials. The `.env.example` file should only contain placeholder values — set actual secrets locally or via your deployment platform's secret manager.

---

## 📜 Available Scripts

Run from the project root:

| Script | Description |
|---|---|
| `npm run dev:backend` | Starts the backend in development mode |
| `npm run dev:frontend` | Starts the frontend dev server |
| `npm run build:backend` | Builds the backend for production |
| `npm run build:frontend` | Builds the frontend for production |
| `npm run prisma:generate` | Generates the Prisma client |
| `npm run prisma:push` | Pushes the Prisma schema to the database |
| `npm run prisma:seed` | Seeds demo/reference data |

---

## 🎬 Demo Walkthrough

A complete manual verification scenario is baked into the project design:

1. Log in as `admin`.
2. Verify pre-seeded master data (e.g. *Azure Furniture*, *Nimesh Pathak*, *Office Chair*, Chart of Accounts, Journals).
3. Create a **Purchase Order** for a vendor → convert to **Vendor Bill** → **Post** → **Register Payment** via Bank.
4. Create a **Sales Order** for a customer (e.g. 5 Office Chairs @ ₹5,000 + 18% GST) → generate **Customer Invoice** → **Post** → **Register Payment**.
5. Log in as the corresponding **Contact User** → verify the customer portal view and paid status.
6. Check **Journal Entries** in the Accounting section — confirm debits and credits balance.
7. Open **Balance Sheet**, **Profit & Loss**, and **Budget Report** — verify figures reconcile with the transactions created.
8. Upload a sample bill via the **OCR Assistant** → verify preview, field extraction, and draft bill creation.

---

## 🗺️ Roadmap

- [ ] Swap heuristic OCR parser for a cloud OCR provider (Google Vision / Tesseract / Mindee)
- [ ] Multi-currency support
- [ ] Bank reconciliation module
- [ ] Recurring invoices/bills
- [ ] Role-based dashboard customization
- [ ] Automated test suite (unit + integration) for accounting invariants
- [ ] Dockerized deployment (backend + frontend + MySQL)

---

## 🤝 Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m "Add your feature"`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

Please make sure any change touching journal posting, payments, or ledger logic includes a check that `Σ Debit == Σ Credit` before and after your change.

---

## 📄 License

This project is licensed under the **ISC License** — see the `package.json` for details.

---

<p align="center">Built with ❤️ for Urban Furniture — bringing enterprise-grade accounting rigor to a modern web stack.</p>
