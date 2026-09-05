-- ============================================================
-- Urban Furniture Accounting System — Database Schema
-- Target: MySQL 8.x (compatible with MariaDB 10.11)
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;
SET NAMES utf8mb4;

-- ============================================================
-- USERS & ROLES
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(255) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('admin','accountant','contact') NOT NULL DEFAULT 'accountant',
  contact_id    INT NULL,
  reset_token   VARCHAR(255) NULL,
  reset_expires DATETIME NULL,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_email (email),
  INDEX idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- CONTACTS (Customer / Vendor / Both)
-- ============================================================
CREATE TABLE IF NOT EXISTS contacts (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(255) NOT NULL,
  type         ENUM('customer','vendor','both') NOT NULL,
  email        VARCHAR(255) NULL,
  mobile       VARCHAR(20) NULL,
  address_line VARCHAR(500) NULL,
  city         VARCHAR(100) NULL,
  state        VARCHAR(100) NULL,
  pincode      VARCHAR(10) NULL,
  profile_image VARCHAR(500) NULL,
  user_id      INT NULL,
  status       ENUM('active','archived') NOT NULL DEFAULT 'active',
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_contacts_type (type),
  INDEX idx_contacts_status (status),
  CONSTRAINT fk_contacts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Link users.contact_id back to contacts
ALTER TABLE users
  ADD CONSTRAINT fk_users_contact FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL;

-- ============================================================
-- PRODUCT CATEGORIES & PRODUCTS
-- ============================================================
CREATE TABLE IF NOT EXISTS product_categories (
  id   INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS products (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  type        ENUM('goods','service','combo') NOT NULL DEFAULT 'goods',
  sales_price DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  cost_price  DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  category_id INT NULL,
  status      ENUM('active','archived') NOT NULL DEFAULT 'active',
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_products_type (type),
  INDEX idx_products_status (status),
  CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES product_categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- CHART OF ACCOUNTS
-- ============================================================
CREATE TABLE IF NOT EXISTS chart_of_accounts (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  code      VARCHAR(20) NOT NULL UNIQUE,
  name      VARCHAR(255) NOT NULL,
  type      ENUM('asset','liability','expense','income','capital') NOT NULL,
  parent_id INT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_coa_type (type),
  INDEX idx_coa_active (is_active),
  CONSTRAINT fk_coa_parent FOREIGN KEY (parent_id) REFERENCES chart_of_accounts(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- JOURNALS (Sales, Purchase, Bank, Cash)
-- ============================================================
CREATE TABLE IF NOT EXISTS journals (
  id                      INT AUTO_INCREMENT PRIMARY KEY,
  name                    VARCHAR(255) NOT NULL,
  type                    ENUM('sale','purchase','bank','cash','general') NOT NULL DEFAULT 'general',
  default_debit_account_id  INT NULL,
  default_credit_account_id INT NULL,
  is_active               BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_journal_debit FOREIGN KEY (default_debit_account_id) REFERENCES chart_of_accounts(id) ON DELETE SET NULL,
  CONSTRAINT fk_journal_credit FOREIGN KEY (default_credit_account_id) REFERENCES chart_of_accounts(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- ANALYTIC ACCOUNTS
-- ============================================================
CREATE TABLE IF NOT EXISTS analytic_accounts (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  name      VARCHAR(255) NOT NULL,
  type      ENUM('income','expense') NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- JOURNAL ENTRIES & ITEMS (core double-entry)
-- ============================================================
CREATE TABLE IF NOT EXISTS journal_entries (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  journal_id  INT NULL,
  date        DATE NOT NULL,
  reference   VARCHAR(255) NULL,
  source_type ENUM('vendor_bill','customer_invoice','payment','manual') NOT NULL DEFAULT 'manual',
  source_id   INT NULL,
  state       ENUM('draft','posted') NOT NULL DEFAULT 'draft',
  total_debit DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  total_credit DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  created_by  INT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_je_date (date),
  INDEX idx_je_journal (journal_id),
  INDEX idx_je_source (source_type, source_id),
  INDEX idx_je_state (state),
  CONSTRAINT fk_je_journal FOREIGN KEY (journal_id) REFERENCES journals(id) ON DELETE SET NULL,
  CONSTRAINT fk_je_user FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS journal_items (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  journal_entry_id   INT NOT NULL,
  account_id         INT NOT NULL,
  analytic_account_id INT NULL,
  debit              DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  credit             DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  description        VARCHAR(500) NULL,
  created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ji_entry (journal_entry_id),
  INDEX idx_ji_account (account_id),
  INDEX idx_ji_analytic (analytic_account_id),
  CONSTRAINT fk_ji_entry FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id) ON DELETE CASCADE,
  CONSTRAINT fk_ji_account FOREIGN KEY (account_id) REFERENCES chart_of_accounts(id) ON DELETE RESTRICT,
  CONSTRAINT fk_ji_analytic FOREIGN KEY (analytic_account_id) REFERENCES analytic_accounts(id) ON DELETE SET NULL,
  CONSTRAINT chk_ji_amounts CHECK (debit >= 0 AND credit >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- PURCHASE ORDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS purchase_orders (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  po_number VARCHAR(50) NOT NULL UNIQUE,
  vendor_id INT NOT NULL,
  date      DATE NOT NULL,
  status    ENUM('draft','confirmed','billed','cancelled') NOT NULL DEFAULT 'draft',
  total     DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  notes     TEXT NULL,
  created_by INT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_po_vendor (vendor_id),
  INDEX idx_po_status (status),
  CONSTRAINT fk_po_vendor FOREIGN KEY (vendor_id) REFERENCES contacts(id) ON DELETE RESTRICT,
  CONSTRAINT fk_po_user FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS purchase_order_lines (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  po_id       INT NOT NULL,
  product_id  INT NULL,
  description VARCHAR(500) NULL,
  quantity    DECIMAL(15,2) NOT NULL DEFAULT 1,
  unit_price  DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  subtotal    DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  INDEX idx_pol_po (po_id),
  CONSTRAINT fk_pol_po FOREIGN KEY (po_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_pol_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
  CONSTRAINT chk_pol_qty CHECK (quantity > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- VENDOR BILLS
-- ============================================================
CREATE TABLE IF NOT EXISTS vendor_bills (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  bill_number     VARCHAR(50) NOT NULL UNIQUE,
  po_id           INT NULL,
  vendor_id       INT NOT NULL,
  invoice_date    DATE NOT NULL,
  due_date        DATE NULL,
  total           DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  paid_amount     DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  outstanding_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  status          ENUM('draft','posted','paid','partly_paid','cancelled') NOT NULL DEFAULT 'draft',
  journal_entry_id INT NULL,
  created_by      INT NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_vb_vendor (vendor_id),
  INDEX idx_vb_status (status),
  CONSTRAINT fk_vb_po FOREIGN KEY (po_id) REFERENCES purchase_orders(id) ON DELETE SET NULL,
  CONSTRAINT fk_vb_vendor FOREIGN KEY (vendor_id) REFERENCES contacts(id) ON DELETE RESTRICT,
  CONSTRAINT fk_vb_je FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id) ON DELETE SET NULL,
  CONSTRAINT fk_vb_user FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS vendor_bill_lines (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  bill_id     INT NOT NULL,
  product_id  INT NULL,
  description VARCHAR(500) NULL,
  quantity    DECIMAL(15,2) NOT NULL DEFAULT 1,
  unit_price  DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  subtotal    DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  INDEX idx_vbl_bill (bill_id),
  CONSTRAINT fk_vbl_bill FOREIGN KEY (bill_id) REFERENCES vendor_bills(id) ON DELETE CASCADE,
  CONSTRAINT fk_vbl_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
  CONSTRAINT chk_vbl_qty CHECK (quantity > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- SALES ORDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS sales_orders (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  so_number   VARCHAR(50) NOT NULL UNIQUE,
  customer_id INT NOT NULL,
  date        DATE NOT NULL,
  status      ENUM('draft','confirmed','invoiced','cancelled') NOT NULL DEFAULT 'draft',
  subtotal    DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  tax_amount  DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  total       DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  notes       TEXT NULL,
  created_by  INT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_so_customer (customer_id),
  INDEX idx_so_status (status),
  CONSTRAINT fk_so_customer FOREIGN KEY (customer_id) REFERENCES contacts(id) ON DELETE RESTRICT,
  CONSTRAINT fk_so_user FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS sales_order_lines (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  so_id       INT NOT NULL,
  product_id  INT NULL,
  description VARCHAR(500) NULL,
  quantity    DECIMAL(15,2) NOT NULL DEFAULT 1,
  unit_price  DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  tax_rate    DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  subtotal    DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  tax_amount  DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  total       DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  INDEX idx_sol_so (so_id),
  CONSTRAINT fk_sol_so FOREIGN KEY (so_id) REFERENCES sales_orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_sol_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
  CONSTRAINT chk_sol_qty CHECK (quantity > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- CUSTOMER INVOICES
-- ============================================================
CREATE TABLE IF NOT EXISTS customer_invoices (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  invoice_number  VARCHAR(50) NOT NULL UNIQUE,
  so_id           INT NULL,
  customer_id     INT NOT NULL,
  invoice_date    DATE NOT NULL,
  due_date        DATE NULL,
  subtotal        DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  tax_amount      DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  total           DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  paid_amount     DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  outstanding_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  status          ENUM('draft','posted','paid','partly_paid','cancelled') NOT NULL DEFAULT 'draft',
  journal_entry_id INT NULL,
  created_by      INT NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_ci_customer (customer_id),
  INDEX idx_ci_status (status),
  CONSTRAINT fk_ci_so FOREIGN KEY (so_id) REFERENCES sales_orders(id) ON DELETE SET NULL,
  CONSTRAINT fk_ci_customer FOREIGN KEY (customer_id) REFERENCES contacts(id) ON DELETE RESTRICT,
  CONSTRAINT fk_ci_je FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id) ON DELETE SET NULL,
  CONSTRAINT fk_ci_user FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS customer_invoice_lines (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  invoice_id  INT NOT NULL,
  product_id  INT NULL,
  description VARCHAR(500) NULL,
  quantity    DECIMAL(15,2) NOT NULL DEFAULT 1,
  unit_price  DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  tax_rate    DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  subtotal    DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  tax_amount  DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  total       DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  INDEX idx_cil_invoice (invoice_id),
  CONSTRAINT fk_cil_invoice FOREIGN KEY (invoice_id) REFERENCES customer_invoices(id) ON DELETE CASCADE,
  CONSTRAINT fk_cil_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
  CONSTRAINT chk_cil_qty CHECK (quantity > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- PAYMENTS & ALLOCATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  payment_number VARCHAR(50) NOT NULL UNIQUE,
  type           ENUM('customer','vendor') NOT NULL,
  partner_id     INT NOT NULL,
  amount         DECIMAL(15,2) NOT NULL,
  payment_method ENUM('cash','bank') NOT NULL,
  date           DATE NOT NULL,
  reference      VARCHAR(255) NULL,
  journal_entry_id INT NULL,
  status         ENUM('draft','posted') NOT NULL DEFAULT 'draft',
  created_by     INT NULL,
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_pay_type (type),
  INDEX idx_pay_partner (partner_id),
  INDEX idx_pay_method (payment_method),
  CONSTRAINT fk_pay_partner FOREIGN KEY (partner_id) REFERENCES contacts(id) ON DELETE RESTRICT,
  CONSTRAINT fk_pay_je FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id) ON DELETE SET NULL,
  CONSTRAINT fk_pay_user FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT chk_pay_amount CHECK (amount > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS payment_allocations (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  payment_id    INT NOT NULL,
  invoice_id    INT NULL,
  bill_id       INT NULL,
  allocated_amount DECIMAL(15,2) NOT NULL,
  INDEX idx_pa_payment (payment_id),
  INDEX idx_pa_invoice (invoice_id),
  INDEX idx_pa_bill (bill_id),
  CONSTRAINT fk_pa_payment FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE,
  CONSTRAINT fk_pa_invoice FOREIGN KEY (invoice_id) REFERENCES customer_invoices(id) ON DELETE SET NULL,
  CONSTRAINT fk_pa_bill FOREIGN KEY (bill_id) REFERENCES vendor_bills(id) ON DELETE SET NULL,
  CONSTRAINT chk_pa_amount CHECK (allocated_amount > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- BUDGETS
-- ============================================================
CREATE TABLE IF NOT EXISTS budgets (
  id                    INT AUTO_INCREMENT PRIMARY KEY,
  name                  VARCHAR(255) NOT NULL,
  period_start          DATE NOT NULL,
  period_end            DATE NOT NULL,
  responsible_person_id INT NULL,
  analytic_account_id   INT NULL,
  planned_amount        DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  committed_amount      DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  achieved_amount       DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  status                ENUM('draft','confirmed','revised','cancelled') NOT NULL DEFAULT 'draft',
  notes                 TEXT NULL,
  created_by            INT NULL,
  created_at            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_budget_status (status),
  INDEX idx_budget_analytic (analytic_account_id),
  INDEX idx_budget_period (period_start, period_end),
  CONSTRAINT fk_budget_responsible FOREIGN KEY (responsible_person_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_budget_analytic FOREIGN KEY (analytic_account_id) REFERENCES analytic_accounts(id) ON DELETE SET NULL,
  CONSTRAINT fk_budget_user FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT chk_budget_dates CHECK (period_end >= period_start)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;