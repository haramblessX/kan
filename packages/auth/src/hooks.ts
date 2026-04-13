import { createClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  image?: string | null;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  stripeCustomerId?: string | null;
};

export type AuthSession = {
  user: AuthUser;
  session: {
    id: string;
    userId: string;
    expiresAt: Date;
  };
};

export type UseSessionResult = {
  data: AuthSession | null;
  isPending: boolean;
  error: Error | null;
};

export function useSession(): UseSessionResult {
  const [data, setData] = useState<AuthSession | null>(null);
  const [isPending, setIsPending] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          setError(new Error(sessionError.message));
          setIsPending(false);
          return;
        }

        if (session?.user) {
          setData({
            user: {
              id: session.user.id,
              email: session.user.email || "",
              name: session.user.user_metadata?.name || session.user.email?.split("@")[0] || "",
              image: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || null,
              emailVerified: !!session.user.email_confirmed_at,
              createdAt: new Date(session.user.created_at),
              updatedAt: new Date(session.user.updated_at || session.user.created_at),
              stripeCustomerId: session.user.user_metadata?.stripeCustomerId || null,
            },
            session: {
              id: session.access_token,
              userId: session.user.id,
              expiresAt: new Date(session.expires_at! * 1000),
            },
          });
        } else {
          setData(null);
        }

        setIsPending(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to get session"));
        setIsPending(false);
      }
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setData({
            user: {
              id: session.user.id,
              email: session.user.email || "",
              name: session.user.user_metadata?.name || session.user.email?.split("@")[0] || "",
              image: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || null,
              emailVerified: !!session.user.email_confirmed_at,
              createdAt: new Date(session.user.created_at),
              updatedAt: new Date(session.user.updated_at || session.user.created_at),
              stripeCustomerId: session.user.user_metadata?.stripeCustomerId || null,
            },
            session: {
              id: session.access_token,
              userId: session.user.id,
              expiresAt: new Date(session.expires_at! * 1000),
            },
          });
        } else {
          setData(null);
        }

        setIsPending(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { data, isPending, error };
}

// Export for authClient compatibility
export const createUseSession = () => useSession;
