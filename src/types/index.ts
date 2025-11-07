/**
 * Shared TypeScript types and interfaces
 */

export interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export interface Invitation {
  id: string;
  user_id: string;
  invitation_code: string;
  groom_name: string;
  bride_name: string;
  ceremony_date: string;
  ceremony_time: string;
  location: string;
  description?: string | null;
  max_guests: number;
  created_at: string;
  updated_at: string;
}

export interface Confirmation {
  id: string;
  invitation_id: string;
  guest_name: string;
  guest_email: string;
  phone?: string | null;
  plus_one: boolean;
  dietary_restrictions?: string | null;
  confirmed: boolean;
  confirmation_code: string;
  qr_code_data?: string | null;
  created_at: string;
  updated_at: string;
}

export interface JWTPayload {
  sub: string;
  email: string;
  role?: string;
  iat?: number;
  exp?: number;
}

export interface ConfirmationStats {
  total: number;
  confirmed: number;
  pending: number;
  with_plus_one: number;
}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
  status?: number;
}

export interface ErrorResponse {
  error: string;
  status: number;
}
