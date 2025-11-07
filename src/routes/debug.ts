import { Hono } from "hono";
import { createSupabaseClient } from "../lib/supabase";

interface CloudflareEnv {
  SUPABASE_URL: string;
  SUPABASE_KEY: string;
  JWT_SECRET: string;
  API_DOMAIN: string;
}

const debug = new Hono<{ Bindings: CloudflareEnv }>();

debug.get("/init-db", async (c) => {
  try {
    const supabase = createSupabaseClient(c.env);

    // Create users table
    const { error: createError } = await supabase.rpc('create_users_table', {
      sql: `
        create table if not exists public.users (
          id uuid default gen_random_uuid() primary key,
          email text unique not null,
          password_hash text not null,
          name text not null,
          role text default 'user',
          created_at timestamp with time zone default timezone('utc'::text, now()) not null
        );

        -- Enable Row Level Security (RLS)
        alter table public.users enable row level security;

        -- Create policy to allow insert for anyone (registration)
        create policy if not exists "Allow registration" 
        on public.users for insert 
        with check (true);

        -- Create policy to allow users to read their own data
        create policy if not exists "Users can read own data" 
        on public.users for select 
        using (true);
      `
    });

    if (createError) {
      return c.json({
        status: 'error',
        error: createError.message,
        details: createError
      }, 500);
    }

    return c.json({
      status: 'ok',
      message: 'Database initialized successfully'
    });
  } catch (e: any) {
    return c.json({
      status: 'error',
      error: e?.message || 'Unknown error',
      details: e
    }, 500);
  }
});

debug.get("/supabase-health", async (c) => {
  try {
    // Log environment variables (don't log full key in production!)
    console.log('Environment check:', {
      SUPABASE_URL: c.env.SUPABASE_URL,
      SUPABASE_KEY_EXISTS: !!c.env.SUPABASE_KEY,
      SUPABASE_KEY_LENGTH: c.env.SUPABASE_KEY?.length
    });

    const supabase = createSupabaseClient(c.env);
    // Simple select to test table access
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (error) {
      return c.json({
        status: 'error',
        error: error.message,
        details: error
      }, 500);
    }

    return c.json({
      status: 'ok',
      data: data
    });
  } catch (e: any) {
    return c.json({
      status: 'error',
      error: e?.message || 'Unknown error',
      stack: e?.stack
    }, 500);
  }
});

// Check table structure
debug.get("/table-info", async (c) => {
  try {
    const supabase = createSupabaseClient(c.env);
    
    // Get table information
    const { data: tables, error: tablesError } = await supabase
      .from('users')
      .select('*')
      .limit(0);

    if (tablesError) {
      return c.json({
        status: 'error',
        error: tablesError.message,
        code: tablesError.code,
        hint: tablesError.hint,
        details: tablesError.details
      }, 500);
    }

    return c.json({
      status: 'ok',
      tableExists: true,
      message: 'Table exists and is accessible'
    });
  } catch (e: any) {
    return c.json({
      status: 'error',
      error: e?.message || 'Unknown error',
      details: e
    }, 500);
  }
});

// Basic connection test without table access
debug.get("/supabase-connection", async (c) => {
  try {
    const supabase = createSupabaseClient(c.env);
    
    // Try a simple query that doesn't require table access
    const { data, error } = await supabase.rpc('version');
    
    return c.json({
      status: 'ok',
      version: data,
      env: {
        url: c.env.SUPABASE_URL,
        keyLength: c.env.SUPABASE_KEY?.length || 0
      }
    });
  } catch (e: any) {
    return c.json({
      status: 'error',
      error: e?.message || 'Unknown error',
      stack: e?.stack
    }, 500);
  }
});

// Check RLS policies
debug.get("/check-policies", async (c) => {
  try {
    const supabase = createSupabaseClient(c.env);
    
    // Test insert permission
    const testEmail = `test_${Date.now()}@example.com`;
    const { error: insertError } = await supabase
      .from('users')
      .insert({
        email: testEmail,
        password_hash: 'test_hash',
        name: 'Test User'
      });

    // Clean up test data
    if (!insertError) {
      await supabase
        .from('users')
        .delete()
        .eq('email', testEmail);
    }

    return c.json({
      status: 'ok',
      insertPermission: !insertError,
      details: insertError ? {
        message: insertError.message,
        hint: insertError.hint,
        code: insertError.code
      } : null
    });
  } catch (e: any) {
    return c.json({
      status: 'error',
      error: e?.message || 'Unknown error',
      details: e
    }, 500);
  }
});

export default debug;