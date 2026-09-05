/**
 * Prisma Database Seeder
 * Run: npm run seed
 *
 * Seeds: Users, Journals, Chart of Accounts, Analytic Accounts, Contacts, Products
 */
import prisma from './client.js';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('🌱 Seeding Urban Furniture database...\n');

  // ── 1. Users ────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@urban.com' },
    update: {},
    create: { name: 'Admin User', email: 'admin@urban.com', login_id: 'admin123', password_hash: passwordHash, role: 'admin' }
  });

  const accountant = await prisma.user.upsert({
    where: { email: 'accountant@urban.com' },
    update: {},
    create: { name: 'Jane Accountant', email: 'accountant@urban.com', login_id: 'acct1234', password_hash: passwordHash, role: 'accountant' }
  });

  console.log(`✅ Users:     ${admin.name}, ${accountant.name}`);

  // ── 2. Journals ──────────────────────────────────────────────────────────
  const journalDefs = [
    { name: 'Sales Journal',    type: 'sale' },
    { name: 'Purchase Journal', type: 'purchase' },
    { name: 'Bank Journal',     type: 'bank' },
    { name: 'Cash Journal',     type: 'cash' },
    { name: 'Miscellaneous',    type: 'general' },
  ];

  for (const j of journalDefs) {
    const exists = await prisma.journal.findFirst({ where: { name: j.name } });
    if (!exists) {
      await prisma.journal.create({ data: { ...j, is_active: true } });
    }
  }
  console.log(`✅ Journals:  ${journalDefs.length} journals`);

  // ── 3. Chart of Accounts ─────────────────────────────────────────────────
  const accounts = [
    { code: '1100', name: 'Cash',                    type: 'asset' },
    { code: '1200', name: 'Bank Account',             type: 'asset' },
    { code: '1300', name: 'Accounts Receivable',      type: 'asset' },
    { code: '1400', name: 'Inventory',                type: 'asset' },
    { code: '1500', name: 'Prepaid Expenses',         type: 'asset' },
    { code: '2100', name: 'Accounts Payable',         type: 'liability' },
    { code: '2200', name: 'Accrued Liabilities',      type: 'liability' },
    { code: '2300', name: 'Sales Tax Payable',        type: 'liability' },
    { code: '3100', name: "Owner's Equity",           type: 'capital' },
    { code: '3200', name: 'Retained Earnings',        type: 'capital' },
    { code: '4100', name: 'Sales Revenue',            type: 'income' },
    { code: '4200', name: 'Service Revenue',          type: 'income' },
    { code: '4300', name: 'Other Income',             type: 'income' },
    { code: '5100', name: 'Cost of Goods Sold',       type: 'expense' },
    { code: '5200', name: 'Salaries & Wages',         type: 'expense' },
    { code: '5300', name: 'Rent Expense',             type: 'expense' },
    { code: '5400', name: 'Utilities Expense',        type: 'expense' },
    { code: '5500', name: 'Marketing & Advertising',  type: 'expense' },
    { code: '5600', name: 'Travel & Entertainment',   type: 'expense' },
    { code: '5700', name: 'Depreciation Expense',     type: 'expense' },
    { code: '5800', name: 'Office Supplies',          type: 'expense' },
    { code: '5900', name: 'Miscellaneous Expense',    type: 'expense' },
  ];

  for (const a of accounts) {
    await prisma.chartOfAccount.upsert({
      where: { code: a.code },
      update: {},
      create: { ...a, is_active: true }
    });
  }
  console.log(`✅ Accounts:  ${accounts.length} chart of accounts`);

  // ── 4. Analytic Accounts ──────────────────────────────────────────────────
  const analytics = [
    { name: 'Revenue Operations',      type: 'income' },
    { name: 'Sales Revenue',           type: 'income' },
    { name: 'Service Income',          type: 'income' },
    { name: 'Operations Expense',      type: 'expense' },
    { name: 'Marketing Expense',       type: 'expense' },
    { name: 'Administration Expense',  type: 'expense' },
  ];

  for (const a of analytics) {
    const exists = await prisma.analyticAccount.findFirst({ where: { name: a.name } });
    if (!exists) {
      await prisma.analyticAccount.create({ data: { ...a, is_active: true } });
    }
  }
  console.log(`✅ Analytic:  ${analytics.length} analytic accounts`);

  // ── 5. Contacts ───────────────────────────────────────────────────────────
  const contacts = [
    { name: 'Timber Craft Supplies', email: 'info@timbercraft.com',    type: 'vendor',   mobile: '+1-800-111-2222' },
    { name: 'Steel & Chrome Ltd.',   email: 'orders@steelchrome.com',  type: 'vendor',   mobile: '+1-800-333-4444' },
    { name: 'Foam Factory Co.',      email: 'sales@foamfactory.com',   type: 'vendor',   mobile: '+1-800-555-6666' },
    { name: 'Global Fabric Imports', email: 'buy@globalfabric.com',    type: 'vendor',   mobile: '+1-800-777-8888' },
    { name: 'Luxe Home Decor',       email: 'purchasing@luxehome.com', type: 'customer', mobile: '+1-212-111-0001' },
    { name: 'Metro Furniture Hub',   email: 'orders@metrofurniture.com',type: 'customer',mobile: '+1-212-222-0002' },
    { name: 'Sunrise Interiors',     email: 'hello@sunrise-int.com',   type: 'customer', mobile: '+1-212-333-0003' },
    { name: 'Coastal Living Stores', email: 'buy@coastalliving.com',   type: 'customer', mobile: '+1-212-444-0004' },
    { name: 'Urban Design Partners', email: 'contact@urbandesign.com', type: 'both',     mobile: '+1-310-555-0005' },
  ];

  let contactCount = 0;
  for (const c of contacts) {
    const exists = await prisma.contact.findFirst({ where: { email: c.email } });
    if (!exists) {
      await prisma.contact.create({ data: { ...c, status: 'active' } });
      contactCount++;
    }
  }
  console.log(`✅ Contacts:  ${contactCount} new contacts`);

  // ── 6. Products ───────────────────────────────────────────────────────────
  const products = [
    { name: 'Oak Dining Table',         type: 'goods',    cost_price: 350, sales_price: 899  },
    { name: 'Leather Sofa (3-Seater)',  type: 'goods',    cost_price: 600, sales_price: 1499 },
    { name: 'King Bed Frame',           type: 'goods',    cost_price: 280, sales_price: 749  },
    { name: 'Bookshelf Unit (5-Tier)',  type: 'goods',    cost_price: 120, sales_price: 299  },
    { name: 'Office Chair Ergonomic',   type: 'goods',    cost_price: 180, sales_price: 449  },
    { name: 'Coffee Table (Glass Top)', type: 'goods',    cost_price: 95,  sales_price: 249  },
    { name: 'Wardrobe (4-Door)',        type: 'goods',    cost_price: 420, sales_price: 1099 },
    { name: 'Assembly Service',         type: 'service',  cost_price: 0,   sales_price: 99   },
    { name: 'Delivery & Installation',  type: 'service',  cost_price: 0,   sales_price: 149  },
  ];

  let productCount = 0;
  for (const p of products) {
    const exists = await prisma.product.findFirst({ where: { name: p.name } });
    if (!exists) {
      await prisma.product.create({ data: { ...p, status: 'active' } });
      productCount++;
    }
  }
  console.log(`✅ Products:  ${productCount} new products`);

  console.log('\n🎉 Seeding complete!\n');
  console.log('  Admin login:      admin@urban.com / password123');
  console.log('  Accountant login: accountant@urban.com / password123\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
