import { randomUUID } from "crypto";
import type { CreateNextContextOptions } from "@trpc/server/adapters/next";
import type { NextApiRequest } from "next";
import type { OpenApiMeta } from "trpc-to-openapi";
import { initTRPC, TRPCError } from "@trpc/server";
import { createClient } from "@supabase/supabase-js";
import { env } from "next-runtime-env";
import superjson from "superjson";
import { ZodError } from "zod";

import type { dbClient } from "@kan/db/client";
import { createDrizzleClient } from "@kan/db/client";
import { createLogger } from "@kan/logger";

const log = createLogger("api");

const TRPC_STATUS_MAP: Partial<Record<TRPCError["code"], number>> = {
  PARSE_ERROR: 400,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_SUPPORTED: 405,
  TIMEOUT: 408,
  CONFLICT: 409,
  PRECONDITION_FAILED: 412,
  PAYLOAD_TOO_LARGE: 413,
  UNPROCESSABLE_CONTENT: 422,
  TOO_MANY_REQUESTS: 429,
  CLIENT_CLOSED_REQUEST: 499,
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
};

export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  image?: string | null | undefined;
  stripeCustomerId?: string | null | undefined;
}

// Parse cookies from header string
const parseCookies = (cookieHeader: string | null): Record<string, string> => {
  if (!cookieHeader) return {};
  return cookieHeader.split(";").reduce((acc, cookie) => {
    const [key, ...valueParts] = cookie.trim().split("=");
    const value = valueParts.join("=");
    if (key && value) acc[key] = value;
    return acc;
  }, {} as Record<string, string>);
};

// Get session from headers - first check Authorization header, then cookies
const getSessionFromHeaders = async (headers: Headers): Promise<{ user: User } | null> => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  
  if (!supabaseUrl || !supabaseAnonKey) {
    log.warn("Supabase URL or Anon Key not configured");
    return null;
  }
  
  let accessToken: string | null = null;
  
  // First, check Authorization header (preferred method)
  const authHeader = headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    accessToken = authHeader.slice(7);
  }
  
  // If no Authorization header, try cookies (fallback)
  if (!accessToken) {
    const cookieHeader = headers.get("cookie");
    const cookies = parseCookies(cookieHeader);
    
    // Find Supabase auth cookies
    const authCookieEntries = Object.entries(cookies).filter(([key]) => 
      key.includes("-auth-token") || key.includes("sb-")
    ).sort(([a], [b]) => a.localeCompare(b));
    
    if (authCookieEntries.length > 0) {
      // Combine all auth cookie chunks
      let tokenData: string;
      if (authCookieEntries.length === 1 && !authCookieEntries[0]![0].includes(".")) {
        tokenData = authCookieEntries[0]![1];
      } else {
        tokenData = authCookieEntries.map(([, v]) => v).join("");
      }
      
      try {
        const decoded = decodeURIComponent(tokenData);
        let jsonStr = decoded;
        if (decoded.match(/^[A-Za-z0-9+/=]+$/)) {
          try {
            jsonStr = Buffer.from(decoded, "base64").toString("utf-8");
          } catch {
            // Not base64
          }
        }
        const parsed = JSON.parse(jsonStr);
        accessToken = parsed.access_token || parsed[0]?.access_token;
      } catch {
        // Failed to parse cookie
      }
    }
  }
  
  if (!accessToken) {
    return null;
  }
  
  // Create Supabase client and validate the token
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data: { user }, error } = await supabase.auth.getUser(accessToken);

  if (error || !user) {
    if (error && !error.message.includes("session")) {
      log.debug({ err: error }, "Supabase auth error");
    }
    return null;
  }

  return {
    user: {
      id: user.id,
      email: user.email || "",
      name: user.user_metadata?.name || user.email?.split("@")[0] || "",
      emailVerified: !!user.email_confirmed_at,
      createdAt: new Date(user.created_at),
      updatedAt: new Date(user.updated_at || user.created_at),
      image: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
      stripeCustomerId: user.user_metadata?.stripeCustomerId || null,
    },
  };
};

// Auth API wrapper for compatibility
const createAuthApi = (headers: Headers) => {
  return {
    api: {
      getSession: () => getSessionFromHeaders(headers),
      signInMagicLink: async (input: { email: string; callbackURL: string }) => {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        
        const { error } = await supabase.auth.signInWithOtp({
          email: input.email,
          options: {
            emailRedirectTo: input.callbackURL,
          },
        });
        
        if (error) throw error;
        return { success: true };
      },
      listActiveSubscriptions: async (_input: { workspacePublicId: string }) => {
        // Subscriptions are now handled separately
        return [];
      },
    },
  };
};

interface CreateContextOptions {
  user: User | null | undefined;
  db: dbClient;
  auth: ReturnType<typeof createAuthApi>;
  headers: Headers;
  transport?: "trpc" | "rest";
}

export const createInnerTRPCContext = (opts: CreateContextOptions) => {
  return {
    user: opts.user,
    db: opts.db,
    auth: opts.auth,
    headers: opts.headers,
    transport: opts.transport ?? "trpc",
    requestId: randomUUID(),
  };
};

export const createTRPCContext = async ({ req }: CreateNextContextOptions) => {
  const db = createDrizzleClient();
  const headers = new Headers(req.headers as Record<string, string>);
  const auth = createAuthApi(headers);

  const session = await auth.api.getSession();

  return createInnerTRPCContext({
    db,
    user: session?.user,
    auth,
    headers,
    transport: "trpc",
  });
};

export const createNextApiContext = async (req: NextApiRequest) => {
  const db = createDrizzleClient();
  const headers = new Headers(req.headers as Record<string, string>);
  const auth = createAuthApi(headers);

  const session = await auth.api.getSession();

  return createInnerTRPCContext({
    db,
    user: session?.user,
    auth,
    headers,
    transport: "trpc",
  });
};

export const createRESTContext = async ({ req }: CreateNextContextOptions) => {
  const db = createDrizzleClient();
  const headers = new Headers(req.headers as Record<string, string>);
  const auth = createAuthApi(headers);

  let session;
  try {
    session = await auth.api.getSession();
  } catch (error) {
    log.warn({ err: error }, "Failed to get session, treating as unauthenticated");
  }

  return createInnerTRPCContext({
    db,
    user: session?.user,
    auth,
    headers,
    transport: "rest",
  });
};

const t = initTRPC
  .context<typeof createTRPCContext>()
  .meta<OpenApiMeta>()
  .create({
    transformer: superjson,
    errorFormatter({ shape, error }) {
      return {
        ...shape,
        data: {
          ...shape.data,
          zodError:
            error.cause instanceof ZodError ? error.cause.flatten() : null,
        },
      };
    },
  });

export const createTRPCRouter = t.router;

export const createCallerFactory = t.createCallerFactory;

const loggingMiddleware = t.middleware(async ({ path, type, next, ctx, getRawInput }) => {
  const start = Date.now();
  const [result, input] = await Promise.all([next(), getRawInput().catch(() => undefined)]);
  const duration = Date.now() - start;

  const { user, transport, requestId } = ctx as {
    user?: { id: string; email: string };
    transport?: string;
    requestId?: string;
  };
  const isCloud = process.env.NEXT_PUBLIC_KAN_ENV === "cloud";
  const meta = {
    requestId,
    procedure: path,
    type,
    transport,
    duration,
    userId: user?.id,
    ...(isCloud && { email: user?.email }),
    input,
  };

  const label = transport === "rest" ? "REST" : "tRPC";

  if (result.ok) {
    log.info({ ...meta, status: 200 }, `${label} OK`);
  } else {
    const status = TRPC_STATUS_MAP[result.error.code] ?? 500;
    const errorCode = result.error.code;
    log.error(
      { ...meta, status, errorCode, err: result.error },
      `${label} error`,
    );
  }

  return result;
});

export const publicProcedure = t.procedure.use(loggingMiddleware);

const enforceUserIsAuthed = t.middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return next({
    ctx,
  });
});

const enforceUserIsAdmin = t.middleware(async ({ ctx, next }) => {
  if (ctx.headers.get("x-admin-api-key") !== env("KAN_ADMIN_API_KEY")) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return next({
    ctx,
  });
});

export const protectedProcedure = t.procedure
  .use(loggingMiddleware)
  .use(enforceUserIsAuthed);

export const adminProtectedProcedure = t.procedure
  .use(loggingMiddleware)
  .use(enforceUserIsAdmin)
  .meta({
    openapi: {
      method: "GET",
      path: "/admin/protected",
    },
  });
