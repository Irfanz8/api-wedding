import { createClient, SupabaseClient } from "@supabase/supabase-js";

interface CloudflareEnv {
  SUPABASE_URL: string;
  SUPABASE_KEY: string;
  JWT_SECRET: string;
  API_DOMAIN: string;
}

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(env: CloudflareEnv): SupabaseClient {
  if (!supabaseClient) {
    supabaseClient = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);
  }
  return supabaseClient;
}

export function createSupabaseClient(env: CloudflareEnv): SupabaseClient {
  try {
    console.log('Creating Supabase client with:', {
      url: env.SUPABASE_URL,
      keyLength: env.SUPABASE_KEY?.length || 0
    });
    
    if (!env.SUPABASE_URL || !env.SUPABASE_KEY) {
      throw new Error('Missing Supabase configuration');
    }

    // Validate URL format
    const url = new URL(env.SUPABASE_URL);
    if (!url.protocol.startsWith('http')) {
      throw new Error('Invalid Supabase URL format');
    }

    // Create client with additional logging
    const client = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);
    console.log('Supabase client created successfully');
    
    return client;
  } catch (error) {
    console.error('Failed to create Supabase client:', error);
    throw error;
  }
}
