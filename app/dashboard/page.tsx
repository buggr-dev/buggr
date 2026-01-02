import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { fetchUserRepos } from "@/lib/github";
import { RepoBranchSelector } from "../components/RepoBranchSelector";
import { Button } from "../components/inputs/Button";
import { LogoutIcon } from "../components/icons";

/**
 * Dashboard page - main application interface for authenticated users.
 * Route is protected by middleware - only authenticated users can access.
 */
export default async function Dashboard() {
  const session = await auth();

  // Type guard: ensure session and accessToken exist (middleware should guarantee this)
  if (!session?.accessToken) {
    redirect("/");
  }

  // Fetch repos for authenticated user
  const repos = await fetchUserRepos(session.accessToken).catch(() => []);

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-[#0d1117]">
      {/* Subtle gradient background */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#161b22] via-[#0d1117] to-[#010409]" />
      
      {/* Decorative grid pattern */}
      <div 
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(#30363d 1px, transparent 1px), linear-gradient(90deg, #30363d 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      />

      {/* Main split layout */}
      <div className="relative flex w-full">
        <RepoBranchSelector repos={repos} accessToken={session.accessToken} />
      </div>

      {/* Header with user info and logout */}
      <div className="absolute right-6 top-6 z-20 flex items-center gap-4">
        <span className="text-sm text-[#8b949e]">
          <span className="font-semibold text-white">{session.user?.name ?? "User"}</span>
        </span>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <Button type="submit" variant="secondary" size="sm">
            <LogoutIcon className="h-4 w-4" />
            Log out
          </Button>
        </form>
      </div>
    </div>
  );
}

