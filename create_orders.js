const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Fetching invoices and bills...');
  const invoices = await prisma.customerInvoice.findMany({ include: { lines: true } });
  const bills = await prisma.vendorBill.findMany({ include: { lines: true } });

  console.log(`Found ${invoices.length} invoices and ${bills.length} bills.`);

  let soCount = 0;
  for (const inv of invoices) {
    if (inv.salesOrderId) continue;

    const soNumber = `SO-${inv.invoiceNumber.replace('INV-', '')}`;
    
    // Create SO
    const so = await prisma.salesOrder.create({
      data: {
        soNumber,
        customerId: inv.customerId,
        soDate: inv.invoiceDate,
        status: 'CONFIRMED',
        subtotal: inv.subtotal,
        taxAmount: inv.taxAmount,
        totalAmount: inv.totalAmount,
        lines: {
          create: inv.lines.map(line => ({
            productId: line.productId,
            analyticAccountId: line.analyticAccountId,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            
            
            
            total: line.total,
          }))
        }
      }
    });

    // Link SO to Invoice
    await prisma.customerInvoice.update({
      where: { id: inv.id },
      data: { salesOrderId: so.id }
    });
    
    soCount++;
  }

  let poCount = 0;
  for (const bill of bills) {
    if (bill.purchaseOrderId) continue;

    const poNumber = `PO-${bill.billNumber.replace('BILL-', '')}`;
    
    // Create PO
    const po = await prisma.purchaseOrder.create({
      data: {
        poNumber,
        vendorId: bill.vendorId,
        poDate: bill.billDate,
        status: 'CONFIRMED',
        
        
        totalAmount: bill.totalAmount,
        lines: {
          create: bill.lines.map(line => ({
            productId: line.productId,
            analyticAccountId: line.analyticAccountId,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            
            
            
            total: line.total,
          }))
        }
      }
    });

    // Link PO to Bill
    await prisma.vendorBill.update({
      where: { id: bill.id },
      data: { purchaseOrderId: po.id }
    });
    
    poCount++;
  }

  console.log(`Created ${soCount} Sales Orders and ${poCount} Purchase Orders!`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
