import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "CASHIER" | "INVENTORY_MANAGER";
};

export async function getSession(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    return null;
  }

  const { user } = session;
  if (!user.isActive) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

export async function requireAuth(
  requiredRole?: AuthUser["role"][],
): Promise<AuthUser> {
  const user = await getSession();
  if (!user) redirect("/login");
  if (requiredRole && !requiredRole.includes(user.role)) redirect("/dashboard");
  return user;
}

export function canAccess(
  userRole: AuthUser["role"],
  allowedRoles: AuthUser["role"][],
): boolean {
  return allowedRoles.includes(userRole);
}
