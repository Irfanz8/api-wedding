import { Hono } from "hono";
import { createSupabaseClient } from "../lib/supabase";
import { getTokenFromHeader, verifyToken, TokenResponse } from "../lib/jwt";
import { generateQRCodeDataUrl } from "../lib/qr";
import { generateRandomString } from "../lib/utils";
import { StandardResponse } from "../types/response";

interface CloudflareEnv {
  SUPABASE_URL: string;
  SUPABASE_KEY: string;
  JWT_SECRET: string;
  API_DOMAIN: string;
  [key: string]: string;
}

const confirmations = new Hono<{ Bindings: CloudflareEnv }>();

interface ConfirmAttendancePayload {
  invitation_code: string;
  guest_name: string;
  guest_email: string;
  phone?: string;
  plus_one?: boolean;
  dietary_restrictions?: string;
  confirmed: boolean;
}

interface UpdateConfirmationPayload {
  confirmed?: boolean;
  guest_name?: string;
  guest_email?: string;
  phone?: string;
  dietary_restrictions?: string;
}

// Confirm attendance (public)
confirmations.post("/confirm", async (c) => {
  try {
    const body = (await c.req.json()) as ConfirmAttendancePayload;

    if (!body.invitation_code || !body.guest_name || !body.guest_email) {
      const response: StandardResponse<null> = {
        status: 'error',
        message: 'Validation failed',
        error: 'invitation_code, guest_name, and guest_email are required'
      };
      return c.json(response, 400);
    }

    const supabase = createSupabaseClient(c.env);

    // Get invitation
    const { data: invitation, error: invError } = await supabase
      .from("invitations")
      .select("*")
      .eq("invitation_code", body.invitation_code)
      .single();

    if (invError || !invitation) {
      return c.json({ error: "Invitation not found" }, 404);
    }

    // Check if confirmation already exists
    const { data: existingConfirmation } = await supabase
      .from("confirmations")
      .select("*")
      .eq("invitation_id", invitation.id)
      .eq("guest_email", body.guest_email)
      .single();

    let confirmationId: string;
    let confirmationCode: string = existingConfirmation ? 
      existingConfirmation.confirmation_code : 
      `CONF${generateRandomString(8).toUpperCase()}`;

    // Generate QR code data
    const qrData = JSON.stringify({
      type: "wedding_confirmation",
      invitation_code: body.invitation_code,
      confirmation_code: confirmationCode,
      guest_email: body.guest_email,
      timestamp: new Date().toISOString(),
    });

    let qrCodeUrl: string | null = null;
    try {
      console.log('Generating QR code with data:', qrData);
      // Convert to base64 using built-in btoa function
      const base64Data = btoa(qrData);
      qrCodeUrl = `data:text/plain;base64,${base64Data}`;
      console.log('QR code generated successfully');
    } catch (qrError) {
      console.error("QR generation error:", qrError);
      qrCodeUrl = qrData; // Fallback to plain text if encoding fails
    }

    if (existingConfirmation) {
      // Update existing confirmation
      const { data: updated, error: updateError } = await supabase
        .from("confirmations")
        .update({
          guest_name: body.guest_name,
          phone: body.phone || null,
          plus_one: body.plus_one || false,
          dietary_restrictions: body.dietary_restrictions || null,
          confirmed: body.confirmed,
          qr_code_data: qrCodeUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingConfirmation.id)
        .select()
        .single();

      if (updateError || !updated) {
        console.error("Update confirmation error:", updateError);
        return c.json({ error: "Failed to update confirmation" }, 500);
      }

      confirmationId = updated.id;
      qrCodeUrl = updated.qr_code_data;
    } else {
      // Create new confirmation
      const { data: newConfirmation, error: createError } = await supabase
        .from("confirmations")
        .insert({
          invitation_id: invitation.id,
          guest_name: body.guest_name,
          guest_email: body.guest_email,
          phone: body.phone || null,
          plus_one: body.plus_one || false,
          dietary_restrictions: body.dietary_restrictions || null,
          confirmed: body.confirmed,
          confirmation_code: confirmationCode,
          qr_code_data: qrCodeUrl,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (createError || !newConfirmation) {
        console.error("Create confirmation error:", createError);
        return c.json({ error: "Failed to create confirmation" }, 500);
      }

      confirmationId = newConfirmation.id;
      qrCodeUrl = newConfirmation.qr_code_data;
    }

    const response: StandardResponse<{
      id: string;
      confirmation_code: string;
      guest_name: string;
      guest_email: string;
      confirmed: boolean;
      qr_code: string | null;
    }> = {
      status: 'success',
      message: 'Attendance confirmed successfully',
      data: {
        id: confirmationId,
        confirmation_code: confirmationCode,
        guest_name: body.guest_name,
        guest_email: body.guest_email,
        confirmed: body.confirmed,
        qr_code: qrCodeUrl,
      }
    };
    return c.json(response, 201);
  } catch (error) {
    console.error("Confirm attendance error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get confirmation by code
confirmations.get("/:confirmationCode", async (c) => {
  try {
    const confirmationCode = c.req.param("confirmationCode");

    if (!confirmationCode) {
      return c.json({ error: "Invalid confirmation code" }, 400);
    }

    const supabase = createSupabaseClient(c.env);

    const { data, error } = await supabase
      .from("confirmations")
      .select(
        "*, invitations(invitation_code, groom_name, bride_name, ceremony_date, location)"
      )
      .eq("confirmation_code", confirmationCode)
      .single();

    if (error || !data) {
      return c.json({ error: "Confirmation not found" }, 404);
    }

    return c.json({ confirmation: data });
  } catch (error) {
    console.error("Get confirmation error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get all confirmations for an invitation (protected)
confirmations.get("/invitations/:invitationId", async (c) => {
  try {
    const invitationId = c.req.param("invitationId");
    const authHeader = c.req.header("Authorization");
    const token = getTokenFromHeader(authHeader);

    if (!token) {
      return c.json({ error: "Missing authorization token" }, 401);
    }

    const tokenResponse = await verifyToken(token, c.env);
    if (!tokenResponse.success || !tokenResponse.payload) {
      return c.json({ error: tokenResponse.error || "Invalid or expired token" }, 401);
    }

    const user = tokenResponse.payload;
    const supabase = createSupabaseClient(c.env);

    // Verify that invitation belongs to user
    const { data: invitation, error: invError } = await supabase
      .from("invitations")
      .select("id")
      .eq("id", invitationId)
      .eq("user_id", user.sub)
      .single();

    if (invError || !invitation) {
      return c.json({ error: "Invitation not found or unauthorized" }, 404);
    }

    // Get all confirmations
    const { data, error } = await supabase
      .from("confirmations")
      .select("*")
      .eq("invitation_id", invitationId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("List confirmations error:", error);
      return c.json({ error: "Failed to fetch confirmations" }, 500);
    }

    const stats = {
      total: data?.length || 0,
      confirmed: data?.filter((c) => c.confirmed).length || 0,
      pending: data?.filter((c) => !c.confirmed).length || 0,
      with_plus_one: data?.filter((c) => c.plus_one).length || 0,
    };

    return c.json({
      confirmations: data || [],
      stats,
    });
  } catch (error) {
    console.error("List confirmations error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Update confirmation (protected)
confirmations.put("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const authHeader = c.req.header("Authorization");
    const token = getTokenFromHeader(authHeader);

    if (!token) {
      return c.json({ error: "Missing authorization token" }, 401);
    }

    const tokenResponse = await verifyToken(token, c.env);
    if (!tokenResponse.success || !tokenResponse.payload) {
      return c.json({ error: tokenResponse.error || "Invalid or expired token" }, 401);
    }

    const user = tokenResponse.payload;
    const body = (await c.req.json()) as UpdateConfirmationPayload;
    const supabase = createSupabaseClient(c.env);

    // Get confirmation and verify authorization
    const { data: confirmation, error: fetchError } = await supabase
      .from("confirmations")
      .select("*, invitations(user_id)")
      .eq("id", id)
      .single();

    if (
      fetchError ||
      !confirmation ||
      confirmation.invitations.user_id !== user.sub
    ) {
      return c.json({ error: "Confirmation not found or unauthorized" }, 404);
    }

    const updateData: any = {};
    if (body.confirmed !== undefined) updateData.confirmed = body.confirmed;
    if (body.guest_name) updateData.guest_name = body.guest_name;
    if (body.guest_email) updateData.guest_email = body.guest_email;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.dietary_restrictions !== undefined)
      updateData.dietary_restrictions = body.dietary_restrictions;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("confirmations")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error || !data) {
      console.error("Update confirmation error:", error);
      return c.json({ error: "Failed to update confirmation" }, 500);
    }

    return c.json({
      message: "Confirmation updated successfully",
      confirmation: data,
    });
  } catch (error) {
    console.error("Update confirmation error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Check-in with QR code (public)
confirmations.post("/check-in", async (c) => {
  try {
    const body = await c.req.json();
    if (!body.qr_code) {
      return c.json({ error: "QR code data is required" }, 400);
    }

    // Extract base64 data from data URL
    const base64Data = body.qr_code.replace(/^data:text\/plain;base64,/, '');
    let qrData;
    
    try {
      // Decode base64 and parse JSON
      const decodedData = atob(base64Data);
      qrData = JSON.parse(decodedData);
    } catch (error) {
      console.error("Invalid QR code data:", error);
      return c.json({ error: "Invalid QR code format" }, 400);
    }

    if (!qrData.confirmation_code || !qrData.invitation_code) {
      return c.json({ error: "Invalid QR code content" }, 400);
    }

    const supabase = createSupabaseClient(c.env);

    // Get confirmation and verify invitation
    const { data: confirmation, error: fetchError } = await supabase
      .from("confirmations")
      .select("*, invitations!inner(*)")
      .eq("confirmation_code", qrData.confirmation_code)
      .eq("invitations.invitation_code", qrData.invitation_code)
      .single();

    if (fetchError || !confirmation) {
      return c.json({ error: "Invalid confirmation or invitation code" }, 404);
    }

    // Check if already checked in
    if (confirmation.status === 'checked-in') {
      return c.json({
        status: 'error',
        message: 'Guest already checked in',
        data: {
          guest_name: confirmation.guest_name,
          checked_in_at: confirmation.updated_at
        }
      }, 400);
    }

    // Update the check-in status
    console.log("Attempting to update check-in status for confirmation ID:", confirmation.id);
    const updateData = {
      status: 'checked-in',
      updated_at: new Date().toISOString()
    };
    console.log("Update data:", updateData);

    const { data: updated, error: updateError } = await supabase
      .from("confirmations")
      .update(updateData)
      .eq("id", confirmation.id)
      .select()
      .single();

    if (updateError) {
      console.error("Check-in update error:", updateError);
      console.error("Error details:", {
        code: updateError.code,
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint
      });
      return c.json({ 
        status: 'error',
        message: 'Failed to update check-in status',
        error: updateError.message || "Database update failed"
      }, 500);
    }

    if (!updated) {
      console.error("No data returned after update");
      return c.json({ 
        status: 'error',
        message: 'Failed to update check-in status',
        error: "No data returned from database"
      }, 500);
    }

    const response: StandardResponse<{
      id: string;
      confirmation_code: string;
      guest_name: string;
      guest_email: string;
      phone?: string;
      plus_one: boolean;
      dietary_restrictions?: string;
      attendance_status: string;
      checked_in_at: string;
      invitation: {
        groom_name: string;
        bride_name: string;
        ceremony_date: string;
        location: string;
      };
    }> = {
      status: 'success',
      message: 'Guest checked in successfully',
      data: {
        id: updated.id,
        confirmation_code: updated.confirmation_code,
        guest_name: updated.guest_name,
        guest_email: updated.guest_email,
        phone: updated.phone || undefined,
        plus_one: updated.plus_one || false,
        dietary_restrictions: updated.dietary_restrictions || undefined,
        attendance_status: updated.attendance_status,
        checked_in_at: updated.updated_at,
        invitation: {
          groom_name: confirmation.invitations.groom_name,
          bride_name: confirmation.invitations.bride_name,
          ceremony_date: confirmation.invitations.ceremony_date,
          location: confirmation.invitations.location
        }
      }
    };

    return c.json(response);
  } catch (error) {
    console.error("Check-in error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Delete confirmation (protected)
confirmations.delete("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const authHeader = c.req.header("Authorization");
    const token = getTokenFromHeader(authHeader);

    if (!token) {
      return c.json({ error: "Missing authorization token" }, 401);
    }

    const tokenResponse = await verifyToken(token, c.env);
    if (!tokenResponse.success || !tokenResponse.payload) {
      return c.json({ error: tokenResponse.error || "Invalid or expired token" }, 401);
    }

    const user = tokenResponse.payload;
    const supabase = createSupabaseClient(c.env);

    // Get confirmation and verify authorization
    const { data: confirmation, error: fetchError } = await supabase
      .from("confirmations")
      .select("*, invitations(user_id)")
      .eq("id", id)
      .single();

    if (
      fetchError ||
      !confirmation ||
      confirmation.invitations.user_id !== user.sub
    ) {
      return c.json({ error: "Confirmation not found or unauthorized" }, 404);
    }

    const { error } = await supabase
      .from("confirmations")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Delete confirmation error:", error);
      return c.json({ error: "Failed to delete confirmation" }, 500);
    }

    return c.json({ message: "Confirmation deleted successfully" });
  } catch (error) {
    console.error("Delete confirmation error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

export default confirmations;
