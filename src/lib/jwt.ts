import { SignJWT, jwtVerify } from "jose";
import { Context } from "hono";

// Extend Hono Context to allow 'user' key
declare module "hono" {
  interface ContextVariableMap {
    user: JWTPayload;
  }
}

// Define proper types
export interface CloudflareEnv {
  JWT_SECRET: string;
  [key: string]: string; // Allow other environment variables
}

export interface JWTPayload {
  sub: string;
  email: string;
  role?: string;
  iat?: number;
  exp?: number;
}

export interface TokenResponse {
  success: boolean;
  payload?: JWTPayload;
  error?: string;
}

const ALGORITHM = "HS256";
const DEFAULT_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export async function generateToken(
  payload: Omit<JWTPayload, "iat" | "exp">,
  env: CloudflareEnv,
  expiresIn: number = DEFAULT_EXPIRY
): Promise<string> {
  try {
    if (!env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured");
    }

    const secret = new TextEncoder().encode(env.JWT_SECRET);
    const now = Math.floor(Date.now() / 1000);

    const token = await new SignJWT({ ...payload })
      .setProtectedHeader({ alg: ALGORITHM })
      .setIssuedAt(now)
      .setExpirationTime(now + Math.floor(expiresIn / 1000))
      .sign(secret);

    return token;
  } catch (error) {
    console.error("Token generation failed:", error);
    throw new Error("Failed to generate token");
  }
}

export async function verifyToken(
  token: string,
  env: CloudflareEnv
): Promise<TokenResponse> {
  try {
    if (!env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured");
    }

    if (!token) {
      return { success: false, error: "No token provided" };
    }

    const secret = new TextEncoder().encode(env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    // Validate and map payload to local JWTPayload type
    if (
      typeof payload.sub === "string" &&
      typeof payload.email === "string"
    ) {
      const mappedPayload: JWTPayload = {
        sub: payload.sub,
        email: payload.email,
        role: typeof payload.role === "string" ? payload.role : undefined,
        iat: typeof payload.iat === "number" ? payload.iat : undefined,
        exp: typeof payload.exp === "number" ? payload.exp : undefined,
      };
      return {
        success: true,
        payload: mappedPayload,
      };
    } else {
      return {
        success: false,
        error: "Invalid token payload structure",
      };
    }
  } catch (error) {
    console.error("Token verification failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Token verification failed",
    };
  }
}

export function getTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader) return null;
  
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
    return null;
  }
  
  return parts[1];
}

export async function protectRoute(
  c: Context<{ Bindings: CloudflareEnv }>
): Promise<JWTPayload | Response> {
  try {
    const authHeader = c.req.header("Authorization");
    const token = getTokenFromHeader(authHeader);

    if (!token) {
      return c.json(
        { success: false, error: "Missing authorization token" },
        401
      );
    }

    const result = await verifyToken(token, c.env);
    
    if (!result.success || !result.payload) {
      return c.json(
        { success: false, error: result.error || "Invalid token" },
        401
      );
    }

    return result.payload;
  } catch (error) {
    console.error("Route protection failed:", error);
    return c.json(
      { success: false, error: "Authentication failed" },
      500
    );
  }
}

// Middleware factory for protected routes
export function authMiddleware() {
  return async (c: Context<{ Bindings: CloudflareEnv }>, next: () => Promise<void>) => {
    const result = await protectRoute(c);
    
    if (result instanceof Response) {
      return result;
    }
    
    // Add user data to context
    c.set('user', result);
    await next();
  };
}
