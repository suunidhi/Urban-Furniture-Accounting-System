# 🪑 Urban Furniture — Accounting System

A full-stack **double-entry accounting system** for a furniture business. It handles master data (Contacts, Products, Chart of Accounts, Journals, Budgets), records purchase & sales transactions, auto-generates journal entries, and produces real-time financial reports — **Balance Sheet**, **Profit & Loss**, and **Budget Report**.

> Built for the final round of a hackathon. The focus is on **correct accounting business logic** (debit/credit integrity, payment tracking, ledger classification) — not just UI screens.

---

## 📌 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Core Accounting Flow](#-core-accounting-flow)
- [Reports](#-reports)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Database Setup](#database-setup)
- [API Overview](#-api-overview)
- [Use-Case Walkthrough](#-use-case-walkthrough)
- [Key Accounting Rules](#-key-accounting-rules)
- [Mockup](#-mockup)
- [Contributors](#-contributors)

---

## 📖 Overview

Urban Furniture is a furniture business that needs a complete accounting workflow — from entering master data, to recording sales/purchases/payments, to automatically generating financial reports.

The system follows the standard accounting pipeline:

```
Master Data → Purchase/Sales → Bill/Invoice → Payment → Auto Journal Entry → Reports
```

Every business action (creating a vendor bill, receiving a customer payment, etc.) automatically creates a **balanced double-entry journal entry** behind the scenes. Reports are computed **live** from ledger balances — nothing is stored separately.

---

## ✨ Features

### Master Data Modules
- **Contact Master** — Customers, Vendors, or Both (name, type, email, mobile, address, profile image)
- **Product Master** — Goods / Service / Combo with sales price, cost, and category
- **Chart of Accounts** — Ledger accounts classified as Asset, Liability, Income, Expense, Capital
- **Journal** — Sales, Purchase, Bank, Cash journals with default accounts
- **Journal Entries** — Double-entry records (debit = credit, always balanced)
- **Analytic Accounts** — Tag income/expenses by project or department
- **Budget** — Planned amounts per period against analytic accounts

### Transaction Flow
- **Purchase Order → Vendor Bill → Payment** (Cash/Bank)
- **Sales Order → Customer Invoice → Payment Received** (Cash/Bank)
- Each transaction auto-generates the corresponding journal entry

### Reports (3)
- **Balance Sheet** — Assets = Liabilities + Capital (real-time snapshot)
- **Profit & Loss** — Income − Expenses = Net Profit / Loss
- **Budget Report** — Planned vs Actual comparison

### Role-Based Access
- **Admin (Business Owner)** — full access: create/modify/archive master data, record transactions, view reports
- **Invoicing User (Accountant)** — create master data, record transactions, view reports
- **Contact** — restricted portal: view only their own invoices/bills, make payments

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS v4, React Router v7, Axios |
| **Backend** | Node.js, Express 5 |
| **Database** | MySQL (via `mysql2`) |
| **ORM** | Prisma |
| **Auth** | JWT (`jsonwebtoken`) + `bcryptjs` for password hashing |
| **Linting** | Oxlint (frontend) |
| **Dev Tools** | Nodemon, PostCSS, Autoprefixer |

---

## 📁 Project Structure

```
Urban-Furniture-Accounting-System/
├── client/                      # Frontend (React + Vite + Tailwind)
│   ├── src/
│   ├── index.html
│   ├── package.json
│   ├── .oxlintrc.json
│   └── vite.config (via @vitejs/plugin-react)
│
├── server/                      # Backend (Express + Prisma + MySQL)
│   ├── src/
│   │   └── index.js             # Entry point (nodemon)
│   ├── prisma/                  # Prisma schema & migrations
│   ├── sql/                     # Raw SQL scripts / schema
│   ├── prisma.config.ts
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## 🔄 Core Accounting Flow

### 1. Master Data Setup
Create the foundation data that gets reused across all transactions:
- Add **Contacts** (customers & vendors)
- Add **Products** (furniture items with sales price & cost)
- Set up the **Chart of Accounts** (Cash, Bank, Debtors, Creditors, Sales Income, Purchase Expense, Capital, etc.)
- Create **Journals** (Sales, Purchase, Bank, Cash) with default accounts

### 2. Purchase Flow
```
Purchase Order (vendor + product + qty + price)
       ↓
Vendor Bill (PO → Bill, invoice date, due date)
       ↓
Payment (Cash or Bank, linked to bill)
```

### 3. Sales Flow
```
Sales Order (customer + product + qty + price + tax)
       ↓
Customer Invoice (SO → Invoice, due date)
       ↓
Payment Received (Cash or Bank, linked to invoice)
```

### 4. Auto Journal Entries
The system automatically creates balanced journal entries for every action:

| User Action | Auto Journal Entry |
|---|---|
| Vendor Bill created | Dr Purchase Expense, Cr Creditors |
| Vendor paid | Dr Creditors, Cr Bank/Cash |
| Customer Invoice created | Dr Debtors, Cr Sales Income |
| Payment received from customer | Dr Cash/Bank, Cr Debtors |
| Owner invests capital | Dr Cash, Cr Capital |

### 5. Reports Generated
Reports are computed live from ledger balances — they are **not** stored in the database.

---

## 📊 Reports

### Balance Sheet
| Liabilities & Capital | Amount | Assets | Amount |
|---|---|---|---|
| Capital | ₹50,000 | Cash | ₹60,000 |
| Creditors | ₹0 | Bank | ₹0 |
| | | Debtors | ₹0 |
| | | Stock | ₹6,000 |
| **Total** | **₹50,000** | **Total** | **₹50,000** |

> Both sides must always balance: **Assets = Liabilities + Capital**

### Profit & Loss
| Particulars | Amount |
|---|---|
| Sales Income | ₹10,000 |
| Less: Purchase Expense | (₹12,000) |
| **Net Profit / (Loss)** | **(₹2,000)** |

### Budget Report
| Budget | Planned | Actual | Variance |
|---|---|---|---|
| Q3 Sales Target | ₹30,000 | ₹10,000 | ₹20,000 under |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18+ (v20 recommended)
- **MySQL** v8+
- **npm** or **pnpm**

### Installation

1. **Clone the repo**
```bash
git clone https://github.com/suunidhi/Urban-Furniture-Accounting-System.git
cd Urban-Furniture-Accounting-System
```

2. **Install server dependencies**
```bash
cd server
npm install
```

3. **Install client dependencies**
```bash
cd ../client
npm install
```

### Environment Variables

Create a `.env` file in the `server/` directory:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL="mysql://root:yourpassword@localhost:3306/urban_furniture"

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# Client URL (for CORS)
CLIENT_URL=http://localhost:5173
```

Create a `.env` file in the `client/` directory:

```env
VITE_API_URL=http://localhost:5000/api
```

### Database Setup

1. **Create the MySQL database**
```sql
CREATE DATABASE urban_furniture;
```

2. **Run Prisma migrations**
```bash
cd server
npx prisma migrate dev --name init
npx prisma generate
```

3. **(Optional) Seed the database** with default Chart of Accounts, sample contacts, and products:
```bash
# If a seed script exists:
npx prisma db seed
```

Or run the raw SQL from `server/sql/` directly in MySQL.

---

## 🔌 API Overview

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a new user (Admin/Accountant) |
| POST | `/api/auth/login` | Login & get JWT token |
| GET | `/api/auth/me` | Get current user profile |

### Master Data
| Method | Endpoint | Description |
|---|---|---|
| GET/POST | `/api/contacts` | List / Create contacts |
| GET/PUT/DELETE | `/api/contacts/:id` | Get / Update / Archive a contact |
| GET/POST | `/api/products` | List / Create products |
| GET/PUT/DELETE | `/api/products/:id` | Get / Update / Archive a product |
| GET/POST | `/api/chart-of-accounts` | List / Create accounts |
| GET/POST | `/api/journals` | List / Create journals |
| GET/POST | `/api/journal-entries` | List / Create journal entries |
| GET/POST | `/api/analytic-accounts` | List / Create analytic accounts |
| GET/POST | `/api/budgets` | List / Create budgets |

### Transactions
| Method | Endpoint | Description |
|---|---|---|
| GET/POST | `/api/purchase-orders` | List / Create purchase orders |
| POST | `/api/purchase-orders/:id/convert` | Convert PO → Vendor Bill |
| GET/POST | `/api/vendor-bills` | List / Create vendor bills |
| GET/POST | `/api/sales-orders` | List / Create sales orders |
| POST | `/api/sales-orders/:id/convert` | Convert SO → Customer Invoice |
| GET/POST | `/api/customer-invoices` | List / Create customer invoices |
| GET/POST | `/api/payments` | Register payments (Cash/Bank) |

### Reports
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/reports/balance-sheet?from=&to=` | Generate Balance Sheet |
| GET | `/api/reports/profit-loss?from=&to=` | Generate P&L Statement |
| GET | `/api/reports/budget?from=&to=` | Generate Budget Report |

---

## 🧪 Use-Case Walkthrough

### 1. Create Master Data
- Add contact **Azure Furniture** (Vendor) and **Nimesh Pathak** (Customer)
- Add product **Office Chair** (Sales Price: ₹2,000, Cost: ₹1,200)
- Set up Chart of Accounts (Cash, Bank, Debtors, Creditors, Sales Income, Purchase Expense, Capital)

### 2. Record a Purchase
- Create a **Purchase Order** for Azure Furniture (10 Office Chairs @ ₹1,200)
- Convert PO → **Vendor Bill** (goods received)
- Register **Payment** via Bank

### 3. Record a Sale
- Create a **Sales Order** for Nimesh Pathak (5 Office Chairs @ ₹2,000)
- Convert SO → **Customer Invoice**
- Register **Payment Received** via Cash

### 4. Generate Reports
- Select a reporting period
- View **Balance Sheet**, **Profit & Loss**, and **Budget Report**

---

## ⚖️ Key Accounting Rules

1. **Double-Entry Integrity** — Every journal entry must have total debits = total credits. The system rejects unbalanced entries.
2. **Auto-Entry on Transactions** — Creating a vendor bill, customer invoice, or payment automatically generates the corresponding journal entry. Users don't manually post debits/credits.
3. **Account Classification** — Every account in the Chart of Accounts has a type (Asset, Liability, Income, Expense, Capital). Reports aggregate by this type.
4. **Balance Sheet Must Balance** — Assets = Liabilities + Capital. If it doesn't, there's an accounting error.
5. **P&L is Period-Based** — Income and expenses are filtered by the selected reporting period.
6. **Budget Tracks Variance** — Planned amounts are compared against actuals (derived from tagged transactions via analytic accounts).
7. **Payments Link to Documents** — Every payment is registered against a specific bill or invoice, reducing the corresponding debtor/creditor balance.

---

## 🎨 Mockup

The UI mockup is available on Excalidraw:
[View Mockup](https://app.excalidraw.com/s/65VNwvy7c4X/6ofCsWuwhe)

---

## 👥 Contributors

- [suunidhi](https://github.com/suunidhi)
- [ShlokStampwala](https://github.com/ShlokStampwala)
- [Sujal140607](https://github.com/Sujal140607)
- [devang-patel09](https://github.com/devang-patel09)

---

## 📄 License

This project is built for a hackathon and is not licensed for commercial use.
