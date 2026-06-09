import { requireAuth } from "@/lib/auth";
import { InventoryViewClient } from "@/components/inventory/inventory-view-client";

export default async function InventoryPage() {
  await requireAuth(["ADMIN", "INVENTORY_MANAGER"]);
  return <InventoryViewClient />;
}
