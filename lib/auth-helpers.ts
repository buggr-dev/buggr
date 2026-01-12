import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import type { User } from "@prisma/client";

/**
 * Result type for requireAuth - either a user or an error response.
 */
type AuthResult =
  | { user: User; error: null }
  | { user: null; error: NextResponse };

/**
 * Validates the session and returns the authenticated user from the database.
 * 
 * This helper consolidates the common auth pattern used across API routes:
 * 1. Check for valid session with email
 * 2. Look up user in database by email
 * 3. Return appropriate error responses if either fails
 * 
 * @returns Object with either { user, error: null } or { user: null, error: NextResponse }
 * 
 * @example
 * export async function GET() {
 *   const { user, error } = await requireAuth();
 *   if (error) return error;
 *   
 *   // user is now typed as User, proceed with logic...
 * }
 */
export async function requireAuth(): Promise<AuthResult> {
  const session = await auth();

  if (!session?.user?.email) {
    return {
      user: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return {
      user: null,
      error: NextResponse.json({ error: "User not found" }, { status: 404 }),
    };
  }

  return { user, error: null };
}
