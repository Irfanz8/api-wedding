import { Hono } from "hono";
import { createSupabaseClient } from "../lib/supabase";
import { getTokenFromHeader, verifyToken } from "../lib/jwt";
import { generateInvitationCode } from "../lib/utils";
import { StandardResponse } from "../types/response";

interface CloudflareEnv {
  SUPABASE_URL: string;
  SUPABASE_KEY: string;
  JWT_SECRET: string;
  API_DOMAIN: string;
}

type UserPayload = { sub: string; [key: string]: any };

const invitations = new Hono<{
  Bindings: CloudflareEnv;
  Variables: {
    user: UserPayload;
  };
}>();

interface CreateInvitationPayload {
  groom_name: string;
  bride_name: string;
  ceremony_date: string;
  ceremony_time: string;
  location: string;
  description?: string;
  max_guests?: number;
}

interface UpdateInvitationPayload {
  groom_name?: string;
  bride_name?: string;
  ceremony_date?: string;
  ceremony_time?: string;
  location?: string;
  description?: string;
  max_guests?: number;
}

// Middleware: Verify JWT token
async function verifyAuth(c: any, next: any) {
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

  const result = await verifyToken(token, c.env);
  if (!result.success || !result.payload) {
    const response: StandardResponse<null> = {
      status: 'error',
      message: 'Authentication failed',
      error: result.error || 'Invalid or expired token'
    };
    return c.json(response, 401);
  }

  c.set("user", result.payload);
  await next();
}

// Create invitation (protected)
invitations.post("/", verifyAuth, async (c) => {
  try {
    const user = c.get("user");
    if (!user || !user.sub) {
      const response: StandardResponse<null> = {
        status: 'error',
        message: 'Authentication failed',
        error: 'User ID not found in token'
      };
      return c.json(response, 401);
    }

    let body: CreateInvitationPayload;
    try {
      body = await c.req.json();
      
      // Validate payload structure
      if (typeof body !== 'object' || body === null) {
        const response: StandardResponse<null> = {
          status: 'error',
          message: 'Invalid request payload',
          error: 'Request body must be a JSON object'
        };
        return c.json(response, 400);
      }

    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      const response: StandardResponse<null> = {
        status: 'error',
        message: 'Invalid JSON format',
        error: parseError instanceof Error ? parseError.message : 'Failed to parse request body'
      };
      return c.json(response, 400);
    }

    if (
      !body.groom_name ||
      !body.bride_name ||
      !body.ceremony_date ||
      !body.ceremony_time ||
      !body.location
    ) {
      return c.json(
        {
          error:
            "groom_name, bride_name, ceremony_date, ceremony_time, and location are required",
        },
        400
      );
    }

    const supabase = createSupabaseClient(c.env);
    const invitationCode = generateInvitationCode(
      body.groom_name,
      body.bride_name,
      body.ceremony_date
    );

    const { data, error } = await supabase
      .from("invitations")
      .insert({
        user_id: user.sub,
        invitation_code: invitationCode,
        groom_name: body.groom_name,
        bride_name: body.bride_name,
        ceremony_date: body.ceremony_date,
        ceremony_time: body.ceremony_time,
        location: body.location,
        description: body.description || null,
        max_guests: body.max_guests || 100,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error || !data) {
      console.error("Create invitation error:", error);
      const response: StandardResponse<null> = {
        status: 'error',
        message: 'Failed to create invitation',
        error: error?.message
      };
      return c.json(response, 500);
    }

    const response: StandardResponse<typeof data> = {
      status: 'success',
      message: 'Invitation created successfully',
      data: data
    };
    return c.json(response, 201);
  } catch (error) {
    console.error("Create invitation error:", error);
    const response: StandardResponse<null> = {
      status: 'error',
      message: 'Internal server error',
      error: error instanceof Error ? error.message : String(error)
    };
    return c.json(response, 500);
  }
});

// Public view invitation
invitations.get("/view/:code", async (c) => {
  try {
    const code = c.req.param("code");

    if (!code || code.length < 5) {
      return c.json({ error: "Invalid invitation code" }, 400);
    }

    const supabase = createSupabaseClient(c.env);

    // Select only necessary fields for public view
    const { data, error } = await supabase
      .from("invitations")
      .select(`
        invitation_code,
        groom_name,
        bride_name,
        ceremony_date,
        ceremony_time,
        location,
        description,
        max_guests
      `)
      .eq("invitation_code", code)
      .single();

    if (error || !data) {
      const response: StandardResponse<null> = {
        status: 'error',
        message: 'Invitation not found',
        error: error?.message
      };
      return c.json(response, 404);
    }

    const formattedData = {
      ...data,
      ceremony_date_formatted: new Date(data.ceremony_date).toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    };

    const response: StandardResponse<typeof formattedData> = {
      status: 'success',
      message: 'Invitation retrieved successfully',
      data: formattedData
    };
    return c.json(response);
  } catch (error) {
    console.error("View invitation error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get invitation by code (protected, for owner)
invitations.get("/:code", verifyAuth, async (c) => {
  try {
    const user = c.get("user");
    const code = c.req.param("code");

    if (!code || code.length < 5) {
      return c.json({ error: "Invalid invitation code" }, 400);
    }

    const supabase = createSupabaseClient(c.env);

    const { data, error } = await supabase
      .from("invitations")
      .select("*")
      .eq("invitation_code", code)
      .eq("user_id", user.sub)
      .single();

    if (error || !data) {
      return c.json({ error: "Invitation not found" }, 404);
    }

    return c.json({ invitation: data });
  } catch (error) {
    console.error("Get invitation error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// List all invitations (protected)
invitations.get("/", verifyAuth, async (c) => {
  try {
    const user = c.get("user");
    const supabase = createSupabaseClient(c.env);

    const { data, error } = await supabase
      .from("invitations")
      .select("*")
      .eq("user_id", user.sub)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("List invitations error:", error);
      const response: StandardResponse<null> = {
        status: 'error',
        message: 'Failed to fetch invitations',
        error: error?.message
      };
      return c.json(response, 500);
    }

    const response: StandardResponse<typeof data> = {
      status: 'success',
      message: 'Invitations retrieved successfully',
      data: data || []
    };
    return c.json(response);
  } catch (error) {
    console.error("List invitations error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Update invitation (protected)
invitations.put("/:id", verifyAuth, async (c) => {
  try {
    const user = c.get("user");
    const id = c.req.param("id");
    const body = (await c.req.json()) as UpdateInvitationPayload;

    const supabase = createSupabaseClient(c.env);

    // Check if invitation belongs to user
    const { data: invitation, error: fetchError } = await supabase
      .from("invitations")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.sub)
      .single();

    if (fetchError || !invitation) {
      return c.json({ error: "Invitation not found or unauthorized" }, 404);
    }

    const updateData: any = {};
    if (body.groom_name) updateData.groom_name = body.groom_name;
    if (body.bride_name) updateData.bride_name = body.bride_name;
    if (body.ceremony_date) updateData.ceremony_date = body.ceremony_date;
    if (body.ceremony_time) updateData.ceremony_time = body.ceremony_time;
    if (body.location) updateData.location = body.location;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.max_guests) updateData.max_guests = body.max_guests;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("invitations")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error || !data) {
      console.error("Update invitation error:", error);
      const response: StandardResponse<null> = {
        status: 'error',
        message: 'Failed to update invitation',
        error: error?.message
      };
      return c.json(response, 500);
    }

    const response: StandardResponse<typeof data> = {
      status: 'success',
      message: 'Invitation updated successfully',
      data: data
    };
    return c.json(response);
  } catch (error) {
    console.error("Update invitation error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Delete invitation (protected)
invitations.delete("/:id", verifyAuth, async (c) => {
  try {
    const user = c.get("user");
    const id = c.req.param("id");

    const supabase = createSupabaseClient(c.env);

    // Check if invitation belongs to user
    const { data: invitation, error: fetchError } = await supabase
      .from("invitations")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.sub)
      .single();

    if (fetchError || !invitation) {
      return c.json({ error: "Invitation not found or unauthorized" }, 404);
    }

    const { error } = await supabase
      .from("invitations")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Delete invitation error:", error);
      const response: StandardResponse<null> = {
        status: 'error',
        message: 'Failed to delete invitation',
        error: error?.message
      };
      return c.json(response, 500);
    }

    const response: StandardResponse<null> = {
      status: 'success',
      message: 'Invitation deleted successfully'
    };
    return c.json(response);
  } catch (error) {
    console.error("Delete invitation error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

export default invitations;
