// OAuth providers are now configured in Supabase Dashboard
// This file provides helper functions for checking which providers are enabled

export const getConfiguredProviders = (): string[] => {
  const providers: string[] = [];
  
  // Check environment variables for enabled providers
  // These are set in Supabase dashboard and optionally mirrored here
  if (process.env.NEXT_PUBLIC_GOOGLE_ENABLED === "true") {
    providers.push("google");
  }
  if (process.env.NEXT_PUBLIC_GITHUB_ENABLED === "true") {
    providers.push("github");
  }
  if (process.env.NEXT_PUBLIC_DISCORD_ENABLED === "true") {
    providers.push("discord");
  }
  if (process.env.NEXT_PUBLIC_APPLE_ENABLED === "true") {
    providers.push("apple");
  }
  if (process.env.NEXT_PUBLIC_MICROSOFT_ENABLED === "true") {
    providers.push("microsoft");
  }
  if (process.env.NEXT_PUBLIC_TWITTER_ENABLED === "true") {
    providers.push("twitter");
  }
  if (process.env.NEXT_PUBLIC_FACEBOOK_ENABLED === "true") {
    providers.push("facebook");
  }
  if (process.env.NEXT_PUBLIC_LINKEDIN_ENABLED === "true") {
    providers.push("linkedin");
  }

  return providers;
};

// For backwards compatibility
export const configuredProviders = {};
export const socialProvidersPlugin = () => ({
  id: "social-providers-plugin",
  endpoints: {},
});
