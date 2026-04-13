import { createClient } from "@supabase/supabase-js";

import { useSession } from "./hooks";

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

        if (data.callbackURL) {
          window.location.href = data.callbackURL;
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
};

export default authClient;
