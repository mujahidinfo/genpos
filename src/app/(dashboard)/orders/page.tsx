import { requireAuth } from "@/lib/auth";
import { OrdersViewClient } from "@/components/orders/orders-view-client";

export default async function OrdersPage() {
  await requireAuth();
  return <OrdersViewClient />;
}
