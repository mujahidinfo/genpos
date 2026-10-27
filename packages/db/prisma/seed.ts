import {
  PrismaClient,
  MemberRole,
  OrderStatus,
  OrderType,
  PaymentMethod,
  StockMovementType,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const BUSINESS_ID = "biz_demo";
const SHOP_ID = "shop_demo";

async function main() {
  console.log("🌱 Seeding GenPOS demo data...");

  // ── Business + first branch ───────────────────────────────────────────
  await prisma.business.upsert({
    where: { id: BUSINESS_ID },
    update: {},
    create: { id: BUSINESS_ID, name: "Demo Boutique", currency: "BDT", language: "bn" },
  });

  await prisma.shop.upsert({
    where: { id: SHOP_ID },
    update: {},
    create: {
      id: SHOP_ID,
      businessId: BUSINESS_ID,
      name: "Demo Boutique",
      address: "123 Main Street, Cityville",
      phone: "+1-555-0100",
      email: "shop@demo.com",
      taxRate: 8.5,
      taxName: "Sales Tax",
    },
  });

  // ── Users + memberships ───────────────────────────────────────────────
  const users = [
    { name: "Admin User", email: "admin@demo.com", password: "admin123", role: MemberRole.OWNER },
    { name: "Jane Cashier", email: "cashier@demo.com", password: "cashier123", role: MemberRole.CASHIER },
    {
      name: "Bob Inventory",
      email: "inventory@demo.com",
      password: "inventory123",
      role: MemberRole.INVENTORY_MANAGER,
    },
  ];

  const created: Record<string, string> = {};
  for (const u of users) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { name: u.name, email: u.email, passwordHash: await bcrypt.hash(u.password, 12) },
    });
    await prisma.membership.upsert({
      where: { userId_businessId: { userId: user.id, businessId: BUSINESS_ID } },
      update: {},
      create: { userId: user.id, businessId: BUSINESS_ID, role: u.role },
    });
    created[u.role] = user.id;
  }

  // ── Categories ────────────────────────────────────────────────────────
  const categoryDefs = [
    { name: "Tops", color: "#6366f1" },
    { name: "Bottoms", color: "#f59e0b" },
    { name: "Footwear", color: "#10b981" },
    { name: "Accessories", color: "#ef4444" },
  ];
  const [tops, bottoms, footwear, accessories] = await Promise.all(
    categoryDefs.map((c) =>
      prisma.category.upsert({
        where: { businessId_name: { businessId: BUSINESS_ID, name: c.name } },
        update: {},
        create: { ...c, businessId: BUSINESS_ID },
      }),
    ),
  );

  // ── Products ──────────────────────────────────────────────────────────
  const products = [
    { name: "Classic White Tee", sku: "TOP-001", price: 19.99, costPrice: 8, categoryId: tops.id, barcode: "1234567890001" },
    { name: "Striped Polo Shirt", sku: "TOP-002", price: 34.99, costPrice: 14, categoryId: tops.id, barcode: "1234567890002" },
    { name: "Slim Fit Jeans", sku: "BOT-001", price: 59.99, costPrice: 24, categoryId: bottoms.id, barcode: "1234567890003" },
    { name: "Chino Pants", sku: "BOT-002", price: 49.99, costPrice: 20, categoryId: bottoms.id, barcode: "1234567890004" },
    { name: "White Sneakers", sku: "SHOE-001", price: 79.99, costPrice: 35, categoryId: footwear.id, barcode: "1234567890005" },
    { name: "Leather Loafers", sku: "SHOE-002", price: 99.99, costPrice: 45, categoryId: footwear.id, barcode: "1234567890006" },
    { name: "Canvas Belt", sku: "ACC-001", price: 14.99, costPrice: 5, categoryId: accessories.id, barcode: "1234567890007" },
    { name: "Sunglasses", sku: "ACC-002", price: 24.99, costPrice: 9, categoryId: accessories.id, barcode: "1234567890008" },
  ];

  const createdProducts = [];
  for (const p of products) {
    createdProducts.push(
      await prisma.product.upsert({
        where: { businessId_sku: { businessId: BUSINESS_ID, sku: p.sku } },
        update: {},
        create: { ...p, businessId: BUSINESS_ID },
      }),
    );
  }

  // ── Variants & per-branch stock ───────────────────────────────────────
  async function addVariant(
    productId: string,
    data: { name: string; sku: string; isDefault?: boolean },
    quantity: number,
    lowStock: number,
  ) {
    const variant = await prisma.productVariant.upsert({
      where: { businessId_sku: { businessId: BUSINESS_ID, sku: data.sku } },
      update: {},
      create: { ...data, productId, businessId: BUSINESS_ID },
    });
    const existing = await prisma.inventory.findUnique({
      where: { shopId_variantId: { shopId: SHOP_ID, variantId: variant.id } },
    });
    if (existing) return;
    await prisma.inventory.create({
      data: { shopId: SHOP_ID, variantId: variant.id, quantity, lowStock },
    });
    await prisma.stockMovement.create({
      data: {
        shopId: SHOP_ID,
        productId,
        variantId: variant.id,
        type: StockMovementType.IN,
        quantity,
        note: "Initial stock",
      },
    });
  }

  const sizes = ["S", "M", "L", "XL"];
  for (const product of createdProducts.slice(0, 6)) {
    for (const size of sizes) {
      await addVariant(product.id, { name: size, sku: `${product.sku}-${size}` }, Math.floor(Math.random() * 30) + 5, 5);
    }
  }
  // Accessories are simple products: one hidden default variant.
  for (const product of createdProducts.slice(6)) {
    await addVariant(product.id, { name: "Default", sku: `${product.sku}-DEF`, isDefault: true }, 50, 10);
  }

  // ── Customers ─────────────────────────────────────────────────────────
  const customerDefs = [
    { name: "Alice Johnson", email: "alice@example.com", phone: "+1-555-0101" },
    { name: "Bob Smith", email: "bob@example.com", phone: "+1-555-0102" },
    { name: "Carol White", email: "carol@example.com", phone: "+1-555-0103" },
  ];
  const customers = await Promise.all(
    customerDefs.map((c) =>
      prisma.customer.upsert({
        where: { businessId_email: { businessId: BUSINESS_ID, email: c.email } },
        update: {},
        create: { ...c, businessId: BUSINESS_ID },
      }),
    ),
  );

  // ── Sample Orders ─────────────────────────────────────────────────────
  const sampleOrders = [
    { customer: customers[0], items: [{ product: createdProducts[0], qty: 2 }, { product: createdProducts[6], qty: 1 }] },
    { customer: customers[1], items: [{ product: createdProducts[2], qty: 1 }, { product: createdProducts[4], qty: 1 }] },
    { customer: null, items: [{ product: createdProducts[1], qty: 3 }] },
  ];

  let orderNum = 1000;
  for (const o of sampleOrders) {
    const orderNumber = `ORD-${++orderNum}`;
    if (await prisma.order.findUnique({ where: { orderNumber } })) continue;

    const subtotal = o.items.reduce((s, i) => s + i.product.price * i.qty, 0);
    const taxAmt = parseFloat((subtotal * 0.085).toFixed(2));
    const total = parseFloat((subtotal + taxAmt).toFixed(2));

    await prisma.order.create({
      data: {
        orderNumber,
        businessId: BUSINESS_ID,
        shopId: SHOP_ID,
        cashierId: created[MemberRole.CASHIER],
        customerId: o.customer?.id ?? null,
        type: OrderType.WALK_IN,
        status: OrderStatus.FULFILLED,
        subtotal,
        taxRate: 8.5,
        taxAmt,
        total,
        paymentMethod: PaymentMethod.CASH,
        items: {
          create: o.items.map((i) => ({
            productId: i.product.id,
            name: i.product.name,
            sku: i.product.sku ?? undefined,
            price: i.product.price,
            quantity: i.qty,
            total: i.product.price * i.qty,
          })),
        },
      },
    });
  }

  console.log("✅ Seed complete!");
  console.log("\n📋 Demo credentials:");
  console.log("  Owner:     admin@demo.com     / admin123");
  console.log("  Cashier:   cashier@demo.com   / cashier123");
  console.log("  Inventory: inventory@demo.com / inventory123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
