import { router } from "@/lib/trpc/server";
import { authRouter } from "./auth";
import { productsRouter } from "./products";
import { ordersRouter } from "./orders";
import { customersRouter } from "./customers";
import { analyticsRouter } from "./analytics";
import { shopRouter } from "./shop";
import { usersRouter } from "./users";
import { categoriesRouter } from "./categories";

export const appRouter = router({
  auth: authRouter,
  products: productsRouter,
  orders: ordersRouter,
  customers: customersRouter,
  analytics: analyticsRouter,
  shop: shopRouter,
  users: usersRouter,
  categories: categoriesRouter,
});

export type AppRouter = typeof appRouter;
