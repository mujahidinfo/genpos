-- SaaS multi-tenancy: Business → Shops (branches) → Memberships, per-branch stock.
--
-- Hand-written so existing single-shop data survives:
--   * all existing rows move into one "legacy" business, the existing Shop
--     (or a new one) becomes its first branch
--   * ProductVariant.stock/lowStock move to Inventory for that branch
--   * User.role becomes a Membership (ADMIN → OWNER)
--   * products without variants get a hidden default variant so they track stock
-- On an empty database none of the backfill inserts anything.

-- ─── New types & tables ─────────────────────────────────────────────────────

CREATE TYPE "MemberRole" AS ENUM ('OWNER', 'MANAGER', 'CASHIER', 'INVENTORY_MANAGER');

CREATE TABLE "Business" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BDT',
    "language" TEXT NOT NULL DEFAULT 'bn',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Business_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Membership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "role" "MemberRole" NOT NULL DEFAULT 'CASHIER',
    "shopId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Inventory" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "lowStock" INTEGER NOT NULL DEFAULT 5,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inventory_pkey" PRIMARY KEY ("id")
);

-- ─── Legacy business + first branch ─────────────────────────────────────────

INSERT INTO "Business" ("id", "name", "currency", "language", "updatedAt")
SELECT
    'legacy_business',
    COALESCE((SELECT "name" FROM "Shop" ORDER BY "createdAt" LIMIT 1), 'My Business'),
    COALESCE((SELECT "currency" FROM "Shop" ORDER BY "createdAt" LIMIT 1), 'BDT'),
    COALESCE((SELECT "language" FROM "Shop" ORDER BY "createdAt" LIMIT 1), 'bn'),
    CURRENT_TIMESTAMP
WHERE EXISTS (SELECT 1 FROM "Shop")
   OR EXISTS (SELECT 1 FROM "User")
   OR EXISTS (SELECT 1 FROM "Product");

ALTER TABLE "Shop"
    ADD COLUMN "businessId" TEXT,
    ADD COLUMN "allowNegativeStock" BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

-- Data existed without a Shop row: create the branch it belongs to.
INSERT INTO "Shop" ("id", "name", "businessId", "taxRate", "taxName", "createdAt", "updatedAt")
SELECT 'legacy_shop', "name", "id", 0, 'Tax', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Business"
WHERE "id" = 'legacy_business' AND NOT EXISTS (SELECT 1 FROM "Shop");

UPDATE "Shop" SET "businessId" = 'legacy_business' WHERE "businessId" IS NULL;

ALTER TABLE "Shop"
    ALTER COLUMN "businessId" SET NOT NULL,
    DROP COLUMN "currency",
    DROP COLUMN "language";

-- The branch that owns all pre-existing per-shop rows.
CREATE TEMP TABLE "_legacy_shop" AS
SELECT "id" FROM "Shop" WHERE "businessId" = 'legacy_business' ORDER BY "createdAt" LIMIT 1;

-- ─── Business-scoped tables ─────────────────────────────────────────────────

ALTER TABLE "Category" ADD COLUMN "businessId" TEXT;
UPDATE "Category" SET "businessId" = 'legacy_business';
ALTER TABLE "Category" ALTER COLUMN "businessId" SET NOT NULL;

ALTER TABLE "Product" ADD COLUMN "businessId" TEXT;
UPDATE "Product" SET "businessId" = 'legacy_business';
ALTER TABLE "Product" ALTER COLUMN "businessId" SET NOT NULL;

ALTER TABLE "ProductVariant"
    ADD COLUMN "businessId" TEXT,
    ADD COLUMN "isDefault" BOOLEAN NOT NULL DEFAULT false;
UPDATE "ProductVariant" SET "businessId" = 'legacy_business';
ALTER TABLE "ProductVariant" ALTER COLUMN "businessId" SET NOT NULL;

ALTER TABLE "Customer" ADD COLUMN "businessId" TEXT;
UPDATE "Customer" SET "businessId" = 'legacy_business';
ALTER TABLE "Customer" ALTER COLUMN "businessId" SET NOT NULL;

ALTER TABLE "ExpenseCategory" ADD COLUMN "businessId" TEXT;
UPDATE "ExpenseCategory" SET "businessId" = 'legacy_business';
ALTER TABLE "ExpenseCategory" ALTER COLUMN "businessId" SET NOT NULL;

ALTER TABLE "Employee" ADD COLUMN "businessId" TEXT;
UPDATE "Employee" SET "businessId" = 'legacy_business';
ALTER TABLE "Employee" ALTER COLUMN "businessId" SET NOT NULL;

-- ─── Shop-scoped tables ─────────────────────────────────────────────────────

ALTER TABLE "Order"
    ADD COLUMN "businessId" TEXT,
    ADD COLUMN "shopId" TEXT,
    ADD COLUMN "amountTendered" DOUBLE PRECISION;
UPDATE "Order" SET "businessId" = 'legacy_business', "shopId" = (SELECT "id" FROM "_legacy_shop");
ALTER TABLE "Order"
    ALTER COLUMN "businessId" SET NOT NULL,
    ALTER COLUMN "shopId" SET NOT NULL;

ALTER TABLE "StockMovement" ADD COLUMN "shopId" TEXT;
UPDATE "StockMovement" SET "shopId" = (SELECT "id" FROM "_legacy_shop");
ALTER TABLE "StockMovement" ALTER COLUMN "shopId" SET NOT NULL;

ALTER TABLE "Expense"
    ADD COLUMN "businessId" TEXT,
    ADD COLUMN "shopId" TEXT;
UPDATE "Expense" SET "businessId" = 'legacy_business', "shopId" = (SELECT "id" FROM "_legacy_shop");
ALTER TABLE "Expense"
    ALTER COLUMN "businessId" SET NOT NULL,
    ALTER COLUMN "shopId" SET NOT NULL;

ALTER TABLE "Budget"
    ADD COLUMN "businessId" TEXT,
    ADD COLUMN "shopId" TEXT;
UPDATE "Budget" SET "businessId" = 'legacy_business', "shopId" = (SELECT "id" FROM "_legacy_shop");
ALTER TABLE "Budget"
    ALTER COLUMN "businessId" SET NOT NULL,
    ALTER COLUMN "shopId" SET NOT NULL;

-- ─── Stock: default variants, then per-branch inventory ─────────────────────

-- Simple products get a hidden default variant so their stock can be tracked.
INSERT INTO "ProductVariant" ("id", "businessId", "productId", "name", "isDefault", "createdAt", "updatedAt")
SELECT 'dv_' || p."id", p."businessId", p."id", 'Default', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Product" p
WHERE NOT EXISTS (SELECT 1 FROM "ProductVariant" v WHERE v."productId" = p."id");

-- Move variant stock to the legacy branch (default variants start at 0).
INSERT INTO "Inventory" ("id", "shopId", "variantId", "quantity", "lowStock", "updatedAt")
SELECT 'inv_' || v."id", s."id", v."id", v."stock", v."lowStock", CURRENT_TIMESTAMP
FROM "ProductVariant" v
CROSS JOIN "_legacy_shop" s;

ALTER TABLE "ProductVariant"
    DROP COLUMN "stock",
    DROP COLUMN "lowStock";

-- ─── Users: roles → memberships ─────────────────────────────────────────────

INSERT INTO "Membership" ("id", "userId", "businessId", "role", "isActive", "updatedAt")
SELECT
    'mem_' || u."id",
    u."id",
    'legacy_business',
    (CASE u."role"::text WHEN 'ADMIN' THEN 'OWNER' ELSE u."role"::text END)::"MemberRole",
    u."isActive",
    CURRENT_TIMESTAMP
FROM "User" u
WHERE EXISTS (SELECT 1 FROM "Business" WHERE "id" = 'legacy_business');

ALTER TABLE "User"
    DROP COLUMN "role",
    ADD COLUMN "avatarUrl" TEXT,
    ADD COLUMN "googleId" TEXT,
    ALTER COLUMN "passwordHash" DROP NOT NULL;

DROP TYPE "Role";

DROP TABLE "_legacy_shop";

-- ─── Indexes: global uniques become per-business ────────────────────────────

DROP INDEX "Category_name_key";
DROP INDEX "Customer_email_key";
DROP INDEX "Employee_email_key";
DROP INDEX "Employee_isActive_idx";
DROP INDEX "Expense_date_idx";
DROP INDEX "ExpenseCategory_name_key";
DROP INDEX "Order_createdAt_idx";
DROP INDEX "Product_barcode_idx";
DROP INDEX "Product_barcode_key";
DROP INDEX "Product_sku_idx";
DROP INDEX "Product_sku_key";
DROP INDEX "ProductVariant_barcode_key";
DROP INDEX "ProductVariant_sku_key";

CREATE INDEX "Shop_businessId_idx" ON "Shop"("businessId");
CREATE INDEX "Membership_businessId_idx" ON "Membership"("businessId");
CREATE UNIQUE INDEX "Membership_userId_businessId_key" ON "Membership"("userId", "businessId");
CREATE INDEX "Inventory_variantId_idx" ON "Inventory"("variantId");
CREATE UNIQUE INDEX "Inventory_shopId_variantId_key" ON "Inventory"("shopId", "variantId");
CREATE INDEX "Budget_shopId_idx" ON "Budget"("shopId");
CREATE UNIQUE INDEX "Category_businessId_name_key" ON "Category"("businessId", "name");
CREATE INDEX "Customer_businessId_phone_idx" ON "Customer"("businessId", "phone");
CREATE UNIQUE INDEX "Customer_businessId_email_key" ON "Customer"("businessId", "email");
CREATE INDEX "Employee_businessId_isActive_idx" ON "Employee"("businessId", "isActive");
CREATE UNIQUE INDEX "Employee_businessId_email_key" ON "Employee"("businessId", "email");
CREATE INDEX "Expense_shopId_date_idx" ON "Expense"("shopId", "date");
CREATE UNIQUE INDEX "ExpenseCategory_businessId_name_key" ON "ExpenseCategory"("businessId", "name");
CREATE INDEX "Order_shopId_createdAt_idx" ON "Order"("shopId", "createdAt");
CREATE INDEX "Order_businessId_idx" ON "Order"("businessId");
CREATE UNIQUE INDEX "Product_businessId_sku_key" ON "Product"("businessId", "sku");
CREATE UNIQUE INDEX "Product_businessId_barcode_key" ON "Product"("businessId", "barcode");
CREATE UNIQUE INDEX "ProductVariant_businessId_sku_key" ON "ProductVariant"("businessId", "sku");
CREATE UNIQUE INDEX "ProductVariant_businessId_barcode_key" ON "ProductVariant"("businessId", "barcode");
CREATE INDEX "StockMovement_shopId_idx" ON "StockMovement"("shopId");
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

-- ─── Foreign keys ───────────────────────────────────────────────────────────

ALTER TABLE "Shop" ADD CONSTRAINT "Shop_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Category" ADD CONSTRAINT "Category_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Product" ADD CONSTRAINT "Product_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExpenseCategory" ADD CONSTRAINT "ExpenseCategory_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
