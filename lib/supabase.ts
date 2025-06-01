import { createClient } from "@supabase/supabase-js"

// Use Neon database URL as the Supabase URL
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://your-project.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "your-anon-key"

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: "public",
  },
  auth: {
    persistSession: false,
  },
  global: {
    headers: {
      "x-application-name": "marketing-crm",
    },
  },
})
