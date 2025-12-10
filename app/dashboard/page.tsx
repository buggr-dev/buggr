import { auth, signOut } from "@/auth";
import { fetchUserRepos } from "@/lib/github";
import { RepoBranchSelector } from "../components/RepoBranchSelector";
import { Button } from "../components/inputs/Button";

/**
 * Dashboard page - main application interface for authenticated users.
 * Route is protected by middleware - only authenticated users can access.
 */
export default async function Dashboard() {
  const session = await auth();

  // Fetch repos for authenticated user
  const repos = session?.accessToken 
    ? await fetchUserRepos(session.accessToken).catch(() => [])
    : [];

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
      <div className="relative z-10 flex w-full">
        <RepoBranchSelector repos={repos} accessToken={session.accessToken!} />
      </div>

      {/* Header with user info and logout */}
      <div className="absolute right-6 top-6 z-20 flex items-center gap-4">
        <span className="text-sm text-[#8b949e]">
          <span className="font-semibold text-white">{session.user.name}</span>
        </span>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <Button type="submit" variant="secondary" size="sm">
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Log out
          </Button>
        </form>
      </div>
    </div>
  );
}

