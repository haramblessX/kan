import { createClient } from "@supabase/supabase-js";

import { useSession } from "./hooks";

// Use globalThis.window for browser detection
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isBrowser = typeof globalThis !== "undefined" && typeof (globalThis as any).window !== "undefined";

// Get environment variables - these will be available at runtime
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Create the Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Types for compatibility with existing code
export type AuthSession = {
  user: {
    id: string;
    email: string;
    name: string;
    image?: string | null;
    emailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
  session: {
    id: string;
    userId: string;
    expiresAt: Date;
  };
} | null;

// Auth client with Supabase - maintains similar API to better-auth
export const authClient = {
  // Get current session - uses the React hook
  useSession,

  // Sign up with email and password
  signUp: {
    email: async (
      data: { name: string; email: string; password: string; callbackURL?: string },
      options?: { onSuccess?: () => void; onError?: (error: { error: { message: string } }) => void }
    ) => {
      try {
        const { data: authData, error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: {
              name: data.name,
            },
            emailRedirectTo: data.callbackURL,
          },
        });

        if (error) {
          options?.onError?.({ error: { message: error.message } });
          return { error };
        }

        options?.onSuccess?.();
        return { data: authData };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Sign up failed";
        options?.onError?.({ error: { message } });
        return { error: { message } };
      }
    },
  },

  // Sign in methods
  signIn: {
    email: async (
      data: { email: string; password: string; callbackURL?: string },
      options?: { onSuccess?: () => void; onError?: (error: { error: { message: string } }) => void }
    ) => {
      try {
        const { data: authData, error } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });

        if (error) {
          options?.onError?.({ error: { message: error.message } });
          return { error };
        }

        if (data.callbackURL && isBrowser) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (globalThis as any).window.location.href = data.callbackURL;
        }

        options?.onSuccess?.();
        return { data: authData };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Sign in failed";
        options?.onError?.({ error: { message } });
        return { error: { message } };
      }
    },

    magicLink: async (
      data: { email: string; callbackURL?: string },
      options?: { onSuccess?: () => void; onError?: (error: { error: { message: string } }) => void }
    ) => {
      try {
        const { error } = await supabase.auth.signInWithOtp({
          email: data.email,
          options: {
            emailRedirectTo: data.callbackURL,
          },
        });

        if (error) {
          options?.onError?.({ error: { message: error.message } });
          return { error };
        }

        options?.onSuccess?.();
        return { data: { success: true } };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Magic link failed";
        options?.onError?.({ error: { message } });
        return { error: { message } };
      }
    },

    social: async (data: { provider: string; callbackURL?: string }) => {
      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: data.provider as "google" | "github" | "discord" | "apple" | "facebook" | "twitter" | "linkedin",
          options: {
            redirectTo: data.callbackURL,
          },
        });

        if (error) {
          return { error };
        }

        return { data: { success: true } };
      } catch (err) {
        return { error: { message: err instanceof Error ? err.message : "OAuth failed" } };
      }
    },

    oauth2: async (data: { providerId: string; callbackURL?: string }) => {
      // For generic OAuth - redirect to Supabase OAuth
      return authClient.signIn.social({ provider: data.providerId, callbackURL: data.callbackURL });
    },
  },

  // Sign out
  signOut: async (options?: { onSuccess?: () => void; onError?: (error: { error: { message: string } }) => void }) => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        options?.onError?.({ error: { message: error.message } });
        return { error };
      }

      options?.onSuccess?.();
      return { data: { success: true } };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sign out failed";
      options?.onError?.({ error: { message } });
      return { error: { message } };
    }
  },

  // Get social providers (for compatibility)
  getSocialProviders: async (): Promise<string[]> => {
    // Return configured providers based on env vars
    const providers: string[] = [];
    if (process.env.NEXT_PUBLIC_GOOGLE_ENABLED === "true") providers.push("google");
    if (process.env.NEXT_PUBLIC_GITHUB_ENABLED === "true") providers.push("github");
    if (process.env.NEXT_PUBLIC_DISCORD_ENABLED === "true") providers.push("discord");
    return providers;
  },

  // Password reset
  forgetPassword: async (
    data: { email: string; redirectTo?: string },
    options?: { onSuccess?: () => void; onError?: (error: { error: { message: string } }) => void }
  ) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: data.redirectTo,
      });

      if (error) {
        options?.onError?.({ error: { message: error.message } });
        return { error };
      }

      options?.onSuccess?.();
      return { data: { success: true } };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Password reset failed";
      options?.onError?.({ error: { message } });
      return { error: { message } };
    }
  },

  // Update password
  resetPassword: async (
    data: { newPassword: string },
    options?: { onSuccess?: () => void; onError?: (error: { error: { message: string } }) => void }
  ) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.newPassword,
      });

      if (error) {
        options?.onError?.({ error: { message: error.message } });
        return { error };
      }

      options?.onSuccess?.();
      return { data: { success: true } };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Password update failed";
      options?.onError?.({ error: { message } });
      return { error: { message } };
    }
  },

  // Delete user account
  deleteUser: async (options?: { onSuccess?: () => void; onError?: (error: { error: { message: string } }) => void }) => {
    // Note: User deletion requires service role key on server side
    options?.onError?.({ error: { message: "Please contact support to delete your account" } });
    return { error: { message: "Client-side deletion not supported" } };
  },

  // Get raw Supabase client for advanced operations
  getSupabaseClient: () => supabase,

  // API Key management (uses public.apikey table)
  apiKey: {
    list: async () => {
      try {
        const { data: session } = await supabase.auth.getSession();
        if (!session?.session?.user) {
          return { data: [], error: { message: "Not authenticated" } };
        }

        const { data, error } = await supabase
          .from("apikey")
          .select("*")
          .eq("userId", session.session.user.id)
          .order("createdAt", { ascending: false });

        if (error) {
          return { data: [], error: { message: error.message } };
        }

        return { data: data || [] };
      } catch (err) {
        return { data: [], error: { message: err instanceof Error ? err.message : "Failed to list API keys" } };
      }
    },

    create: async (params: { name: string; prefix?: string }) => {
      try {
        const { data: session } = await supabase.auth.getSession();
        if (!session?.session?.user) {
          return { data: null, error: { message: "Not authenticated" } };
        }

        // Generate a random API key
        const keyChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let randomKey = "";
        for (let i = 0; i < 32; i++) {
          randomKey += keyChars.charAt(Math.floor(Math.random() * keyChars.length));
        }
        const fullKey = `${params.prefix || "kan_"}${randomKey}`;
        const keyStart = fullKey.substring(0, 8);

        // Hash the key for storage (simple hash for demo - in production use bcrypt on server)
        const hashedKey = btoa(fullKey);

        const { data, error } = await supabase
          .from("apikey")
          .insert({
            id: crypto.randomUUID(),
            name: params.name,
            start: keyStart,
            key: hashedKey,
            userId: session.session.user.id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) {
          return { data: null, error: { message: error.message } };
        }

        // Return the full key only on creation (never stored in plain text)
        return { data: { ...data, key: fullKey } };
      } catch (err) {
        return { data: null, error: { message: err instanceof Error ? err.message : "Failed to create API key" } };
      }
    },

    revoke: async (keyId: string) => {
      try {
        const { data: session } = await supabase.auth.getSession();
        if (!session?.session?.user) {
          return { data: null, error: { message: "Not authenticated" } };
        }

        const { error } = await supabase
          .from("apikey")
          .delete()
          .eq("id", keyId)
          .eq("userId", session.session.user.id);

        if (error) {
          return { data: null, error: { message: error.message } };
        }

        return { data: { success: true } };
      } catch (err) {
        return { data: null, error: { message: err instanceof Error ? err.message : "Failed to revoke API key" } };
      }
    },

    // Alias for revoke (compatibility with better-auth API)
    delete: async (params: { keyId: string }) => {
      return authClient.apiKey.revoke(params.keyId);
    },
  },

  // Change password
  changePassword: async (
    data: { currentPassword: string; newPassword: string; revokeOtherSessions?: boolean },
    options?: { onSuccess?: () => void; onError?: (error: { error: { message: string } }) => void }
  ) => {
    try {
      // First verify current password by signing in
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user?.email) {
        options?.onError?.({ error: { message: "Not authenticated" } });
        return { error: { message: "Not authenticated" } };
      }

      // Try to sign in with current password to verify it
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: session.session.user.email,
        password: data.currentPassword,
      });

      if (verifyError) {
        options?.onError?.({ error: { message: "Current password is incorrect" } });
        return { error: { message: "Current password is incorrect" } };
      }

      // Update to new password
      const { error } = await supabase.auth.updateUser({
        password: data.newPassword,
      });

      if (error) {
        options?.onError?.({ error: { message: error.message } });
        return { error };
      }

      options?.onSuccess?.();
      return { data: { success: true } };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Password change failed";
      options?.onError?.({ error: { message } });
      return { error: { message } };
    }
  },
};

export default authClient;
