"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticating, setIsAuthenticating] = useState(true);

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
    
    // If user is not authenticated and not on the login page, redirect them.
    if (!isAuthenticated && pathname !== "/login") {
      router.push("/login");
    } 
    // If user is authenticated and on the login page, redirect to home.
    else if (isAuthenticated && pathname === "/login") {
       router.push("/");
    } 
    // Otherwise, authentication is complete.
    else {
      setIsAuthenticating(false);
    }
  }, [pathname, router]);

  // While checking authentication, show a loading screen
  if (isAuthenticating) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
