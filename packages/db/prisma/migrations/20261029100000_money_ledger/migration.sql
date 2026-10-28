-- CreateEnum
CREATE TYPE "ExpenseSource" AS ENUM ('MANUAL', 'SALARY', 'SUPPLIER_PAYMENT', 'RECURRING');

-- CreateEnum
CREATE TYPE "RecurringFrequency" AS ENUM ('WEEKLY', 'MONTHLY');

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "membershipId" TEXT,
ADD COLUMN     "payDay" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Expense" ADD COLUMN     "periodKey" TEXT,
ADD COLUMN     "recurringId" TEXT,
ADD COLUMN     "source" "ExpenseSource" NOT NULL DEFAULT 'MANUAL',
ADD COLUMN     "supplierPaymentId" TEXT;

-- CreateTable
CREATE TABLE "RecurringExpense" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "categoryId" TEXT NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'CASH',
    "frequency" "RecurringFrequency" NOT NULL DEFAULT 'MONTHLY',
    "nextDueDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecurringExpense_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecurringExpense_shopId_isActive_nextDueDate_idx" ON "RecurringExpense"("shopId", "isActive", "nextDueDate");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_membershipId_key" ON "Employee"("membershipId");

-- CreateIndex
CREATE UNIQUE INDEX "Expense_supplierPaymentId_key" ON "Expense"("supplierPaymentId");

-- CreateIndex
CREATE INDEX "Expense_employeeId_periodKey_idx" ON "Expense"("employeeId", "periodKey");

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_supplierPaymentId_fkey" FOREIGN KEY ("supplierPaymentId") REFERENCES "SupplierPayment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_recurringId_fkey" FOREIGN KEY ("recurringId") REFERENCES "RecurringExpense"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringExpense" ADD CONSTRAINT "RecurringExpense_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringExpense" ADD CONSTRAINT "RecurringExpense_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringExpense" ADD CONSTRAINT "RecurringExpense_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ExpenseCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Backfill: money already paid to suppliers becomes "Stock purchases" expenses,
-- so the ledger (and profit) covers history too. Payments tied to a delivery use
-- that branch; others use the business's oldest branch.
INSERT INTO "ExpenseCategory" ("id", "businessId", "name", "color", "updatedAt")
SELECT 'bf' || substr(md5(sp."businessId" || 'stock'), 1, 22), sp."businessId", 'Stock purchases', '#0ea5e9', CURRENT_TIMESTAMP
FROM "SupplierPayment" sp
GROUP BY sp."businessId"
ON CONFLICT ("businessId", "name") DO NOTHING;

INSERT INTO "Expense" ("id", "businessId", "shopId", "title", "amount", "date", "categoryId", "paymentMethod", "status", "source", "supplierPaymentId", "updatedAt")
SELECT
  'bf' || substr(md5(sp."id"), 1, 22),
  sp."businessId",
  COALESCE(p."shopId", (SELECT s."id" FROM "Shop" s WHERE s."businessId" = sp."businessId" ORDER BY s."createdAt" LIMIT 1)),
  'Paid ' || sup."name",
  sp."amount",
  sp."createdAt",
  c."id",
  sp."paymentMethod",
  'PAID',
  'SUPPLIER_PAYMENT',
  sp."id",
  CURRENT_TIMESTAMP
FROM "SupplierPayment" sp
JOIN "Supplier" sup ON sup."id" = sp."supplierId"
LEFT JOIN "Purchase" p ON p."id" = sp."purchaseId"
JOIN "ExpenseCategory" c ON c."businessId" = sp."businessId" AND c."name" = 'Stock purchases'
WHERE COALESCE(p."shopId", (SELECT s."id" FROM "Shop" s WHERE s."businessId" = sp."businessId" ORDER BY s."createdAt" LIMIT 1)) IS NOT NULL;
