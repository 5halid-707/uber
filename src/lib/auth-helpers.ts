import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export type SessionUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  phone?: string;
};

export async function getAuthenticatedUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
   
  const userId = (session.user as any).id;
  if (!userId) return null;
  const user = await db.user.findUnique({ where: { id: userId } });
  return user;
}

export async function requireAuth() {
  const user = await getAuthenticatedUser();
  return user;
}

export async function requireAdmin() {
  const user = await getAuthenticatedUser();
  if (!user || !user.isAdmin) return null;
  return user;
}
