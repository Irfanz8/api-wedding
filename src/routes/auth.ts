import { Hono } from "hono";
import { createSupabaseClient } from "../lib/supabase";
import { generateToken, verifyToken, getTokenFromHeader } from "../lib/jwt";
import { hashPassword, verifyPassword, generateRandomString } from "../lib/utils";
import { StandardResponse } from "../types/response";

interface CloudflareEnv {
  [key: string]: string;
  SUPABASE_URL: string;
  SUPABASE_KEY: string;
  JWT_SECRET: string;
  API_DOMAIN: string;
}

const auth = new Hono<{ Bindings: CloudflareEnv }>();

interface RegisterPayload {
  email: string;
  password: string;
  name: string;
}

interface LoginPayload {
  email: string;
  password: string;
}

// Register
auth.post("/register", async (c) => {
  try {
    const body = (await c.req.json()) as RegisterPayload;

    if (!body.email || !body.password || !body.name) {
      const response: StandardResponse<null> = {
        status: 'error',
        message: 'Validation failed',
        error: 'Email, password, and name are required'
      };
      return c.json(response, 400);
    }

    const supabase = createSupabaseClient(c.env);
    const hashedPassword = await hashPassword(body.password);

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", body.email)
      .single();

    if (existingUser) {
      const response: StandardResponse<null> = {
        status: 'error',
        message: 'Registration failed',
        error: 'Email already registered'
      };
      return c.json(response, 400);
    }

    // Create new user
    console.log('Attempting to create user with data:', {
      email: body.email,
      name: body.name,
      created_at: new Date().toISOString()
    });

    const { data: newUser, error } = await supabase
      .from("users")
      .insert({
        email: body.email,
        password_hash: hashedPassword,
        name: body.name,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error || !newUser) {
      console.error("Registration error:", error);
      console.error("Supabase URL:", c.env.SUPABASE_URL);
      const response: StandardResponse<null> = {
        status: 'error',
        message: 'Registration failed',
        error: error?.message || "Failed to create user"
      };
      return c.json(response, 500);
    }

    // Generate token
    const token = await generateToken(
      {
        sub: newUser.id,
        email: newUser.email,
        role: "user",
      },
      c.env
    );

    const response: StandardResponse<{
      user: {
        id: string;
        email: string;
        name: string;
      };
      token: string;
    }> = {
      status: 'success',
      message: 'User registered successfully',
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
        },
        token
      }
    };

    return c.json(response, 201);
  } catch (error) {
    console.error("Register error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Login
auth.post("/login", async (c) => {
  try {
    const body = (await c.req.json()) as LoginPayload;

    if (!body.email || !body.password) {
      const response: StandardResponse<null> = {
        status: 'error',
        message: 'Validation failed',
        error: 'Email and password are required'
      };
      return c.json(response, 400);
    }

    const supabase = createSupabaseClient(c.env);

    // Get user by email
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", body.email)
      .single();

    if (error || !user) {
      const response: StandardResponse<null> = {
        status: 'error',
        message: 'Authentication failed',
        error: 'Invalid email or password'
      };
      return c.json(response, 401);
    }

    // Verify password
    const passwordValid = await verifyPassword(body.password, user.password_hash);
    if (!passwordValid) {
      const response: StandardResponse<null> = {
        status: 'error',
        message: 'Authentication failed',
        error: 'Invalid email or password'
      };
      return c.json(response, 401);
    }

    // Generate token
    const token = await generateToken(
      {
        sub: user.id,
        email: user.email,
        role: user.role || "user",
      },
      c.env
    );

    const response: StandardResponse<{
      user: {
        id: string;
        email: string;
        name: string;
      };
      token: string;
    }> = {
      status: 'success',
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        token
      }
    };

    return c.json(response, 200);
  } catch (error) {
    console.error("Login error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Verify token
auth.post("/verify", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const token = getTokenFromHeader(authHeader);

    if (!token) {
      const response: StandardResponse<null> = {
        status: 'error',
        message: 'Authentication failed',
        error: 'Missing authorization token'
      };
      return c.json(response, 401);
    }

    const payload = await verifyToken(token, c.env);
    if (!payload) {
      const response: StandardResponse<null> = {
        status: 'error',
        message: 'Authentication failed',
        error: 'Invalid or expired token'
      };
      return c.json(response, 401);
    }

    const response: StandardResponse<{
      valid: boolean;
      payload: any;
    }> = {
      status: 'success',
      message: 'Token verified successfully',
      data: {
        valid: true,
        payload
      }
    };

    return c.json(response);
  } catch (error) {
    console.error("Verify error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get current user
auth.get("/me", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const token = getTokenFromHeader(authHeader);

    if (!token) {
      const response: StandardResponse<null> = {
        status: 'error',
        message: 'Authentication failed',
        error: 'Missing authorization token'
      };
      return c.json(response, 401);
    }

    const payload = await verifyToken(token, c.env);
    if (!payload) {
      const response: StandardResponse<null> = {
        status: 'error',
        message: 'Authentication failed',
        error: 'Invalid or expired token'
      };
      return c.json(response, 401);
    }

    const supabase = createSupabaseClient(c.env);
    const { data: user, error } = await supabase
      .from("users")
      .select("id, email, name, role, created_at")
      .single();

    if (error || !user) {
      const response: StandardResponse<null> = {
        status: 'error',
        message: 'User not found',
        error: error?.message || 'User could not be retrieved'
      };
      return c.json(response, 404);
    }

    const response: StandardResponse<typeof user> = {
      status: 'success',
      message: 'User retrieved successfully',
      data: user
    };

    return c.json(response);
  } catch (error) {
    console.error("Get user error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

export default auth;
