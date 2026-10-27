-- A POS sale is money already taken over the counter, so new orders land
-- FULFILLED instead of PENDING. This changes the default for NEW rows only —
-- existing PENDING orders are intentionally left alone, since rewriting
-- historical order status would silently restate past revenue reports.
-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "status" SET DEFAULT 'FULFILLED';

-- AlterTable
ALTER TABLE "Shop" ALTER COLUMN "currency" SET DEFAULT 'BDT',
ALTER COLUMN "language" SET DEFAULT 'bn';
