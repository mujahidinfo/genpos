import {
  PrismaClient,
  Role,
  OrderStatus,
  OrderType,
  PaymentMethod,
  StockMovementType,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding GenPOS demo data...");

  // ── Shop ──────────────────────────────────────────────────────────────
  await prisma.shop.upsert({
    where: { id: "shop_demo" },
    update: {},
    create: {
      id: "shop_demo",
      name: "Demo Boutique",
      address: "123 Main Street, Cityville",
      phone: "+1-555-0100",
      email: "shop@demo.com",
      currency: "USD",
      taxRate: 8.5,
      taxName: "Sales Tax",
    },
  });

  // ── Users ─────────────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash("admin123", 12);
  const cashierHash = await bcrypt.hash("cashier123", 12);
  const invHash = await bcrypt.hash("inventory123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@demo.com" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@demo.com",
      passwordHash: adminHash,
      role: Role.ADMIN,
    },
  });

  const cashier = await prisma.user.upsert({
    where: { email: "cashier@demo.com" },
    update: {},
    create: {
      name: "Jane Cashier",
      email: "cashier@demo.com",
      passwordHash: cashierHash,
      role: Role.CASHIER,
    },
  });

  await prisma.user.upsert({
    where: { email: "inventory@demo.com" },
    update: {},
    create: {
      name: "Bob Inventory",
      email: "inventory@demo.com",
      passwordHash: invHash,
      role: Role.INVENTORY_MANAGER,
    },
  });

  // ── Categories ────────────────────────────────────────────────────────
  const cats = await Promise.all([
    prisma.category.upsert({
      where: { name: "Tops" },
      update: {},
      create: { name: "Tops", color: "#6366f1" },
    }),
    prisma.category.upsert({
      where: { name: "Bottoms" },
      update: {},
      create: { name: "Bottoms", color: "#f59e0b" },
    }),
    prisma.category.upsert({
      where: { name: "Footwear" },
      update: {},
      create: { name: "Footwear", color: "#10b981" },
    }),
    prisma.category.upsert({
      where: { name: "Accessories" },
      update: {},
      create: { name: "Accessories", color: "#ef4444" },
    }),
  ]);

  const [tops, bottoms, footwear, accessories] = cats;

  // ── Products ──────────────────────────────────────────────────────────
  const products = [
    {
      name: "Classic White Tee",
      sku: "TOP-001",
      price: 19.99,
      costPrice: 8,
      categoryId: tops.id,
      barcode: "1234567890001",
    },
    {
      name: "Striped Polo Shirt",
      sku: "TOP-002",
      price: 34.99,
      costPrice: 14,
      categoryId: tops.id,
      barcode: "1234567890002",
    },
    {
      name: "Slim Fit Jeans",
      sku: "BOT-001",
      price: 59.99,
      costPrice: 24,
      categoryId: bottoms.id,
      barcode: "1234567890003",
    },
    {
      name: "Chino Pants",
      sku: "BOT-002",
      price: 49.99,
      costPrice: 20,
      categoryId: bottoms.id,
      barcode: "1234567890004",
    },
    {
      name: "White Sneakers",
      sku: "SHOE-001",
      price: 79.99,
      costPrice: 35,
      categoryId: footwear.id,
      barcode: "1234567890005",
    },
    {
      name: "Leather Loafers",
      sku: "SHOE-002",
      price: 99.99,
      costPrice: 45,
      categoryId: footwear.id,
      barcode: "1234567890006",
    },
    {
      name: "Canvas Belt",
      sku: "ACC-001",
      price: 14.99,
      costPrice: 5,
      categoryId: accessories.id,
      barcode: "1234567890007",
    },
    {
      name: "Sunglasses",
      sku: "ACC-002",
      price: 24.99,
      costPrice: 9,
      categoryId: accessories.id,
      barcode: "1234567890008",
    },
  ];

  const createdProducts = [];
  for (const p of products) {
    const product = await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: p,
    });
    createdProducts.push(product);
  }

  // ── Variants & Stock ──────────────────────────────────────────────────
  const sizes = ["S", "M", "L", "XL"];
  for (const product of createdProducts.slice(0, 6)) {
    for (const size of sizes) {
      const vSku = `${product.sku}-${size}`;
      const variant = await prisma.productVariant.upsert({
        where: { sku: vSku },
        update: {},
        create: {
          productId: product.id,
          name: size,
          sku: vSku,
          stock: Math.floor(Math.random() * 30) + 5,
          lowStock: 5,
        },
      });
      await prisma.stockMovement.create({
        data: {
          productId: product.id,
          variantId: variant.id,
          type: StockMovementType.IN,
          quantity: variant.stock,
          note: "Initial stock",
        },
      });
    }
  }

  // Accessories get simple stock
  for (const product of createdProducts.slice(6)) {
    const variant = await prisma.productVariant.upsert({
      where: { sku: `${product.sku}-ONE` },
      update: {},
      create: {
        productId: product.id,
        name: "One Size",
        sku: `${product.sku}-ONE`,
        stock: 50,
        lowStock: 10,
      },
    });
    await prisma.stockMovement.create({
      data: {
        productId: product.id,
        variantId: variant.id,
        type: StockMovementType.IN,
        quantity: 50,
        note: "Initial stock",
      },
    });
  }

  // ── Customers ─────────────────────────────────────────────────────────
  const customers = await Promise.all([
    prisma.customer.upsert({
      where: { email: "alice@example.com" },
      update: {},
      create: {
        name: "Alice Johnson",
        email: "alice@example.com",
        phone: "+1-555-0101",
      },
    }),
    prisma.customer.upsert({
      where: { email: "bob@example.com" },
      update: {},
      create: {
        name: "Bob Smith",
        email: "bob@example.com",
        phone: "+1-555-0102",
      },
    }),
    prisma.customer.upsert({
      where: { email: "carol@example.com" },
      update: {},
      create: {
        name: "Carol White",
        email: "carol@example.com",
        phone: "+1-555-0103",
      },
    }),
  ]);

  // ── Sample Orders ─────────────────────────────────────────────────────
  const sampleOrders = [
    {
      customer: customers[0],
      items: [
        { product: createdProducts[0], qty: 2 },
        { product: createdProducts[6], qty: 1 },
      ],
    },
    {
      customer: customers[1],
      items: [
        { product: createdProducts[2], qty: 1 },
        { product: createdProducts[4], qty: 1 },
      ],
    },
    { customer: null, items: [{ product: createdProducts[1], qty: 3 }] },
  ];

  let orderNum = 1000;
  for (const o of sampleOrders) {
    const subtotal = o.items.reduce((s, i) => s + i.product.price * i.qty, 0);
    const taxAmt = parseFloat((subtotal * 0.085).toFixed(2));
    const total = parseFloat((subtotal + taxAmt).toFixed(2));

    await prisma.order.create({
      data: {
        orderNumber: `ORD-${++orderNum}`,
        cashierId: cashier.id,
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
  console.log("  Admin:     admin@demo.com     / admin123");
  console.log("  Cashier:   cashier@demo.com   / cashier123");
  console.log("  Inventory: inventory@demo.com / inventory123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
