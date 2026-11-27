import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// The browser client uses only the public anon/publishable key.
// Row Level Security in Supabase protects private data.
export const supabase = url && key ? createClient(url, key) : null;