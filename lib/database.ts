import { createClient } from "@supabase/supabase-js"

// Use environment variables with fallbacks
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key"

// Validate that we have proper environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn("Supabase environment variables not found. Using fallback configuration.")
}

export const db = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: "public",
  },
  auth: {
    persistSession: false,
  },
})

// Database operations using Supabase client
export const clientsService = {
  async getAll() {
    try {
      const { data, error } = await db.from("clients").select("*").order("name", { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Error fetching clients:", error)
      return []
    }
  },

  async create(client: any) {
    const { data, error } = await db.from("clients").insert(client).select().single()

    if (error) throw error
    return data
  },

  async update(id: string, updates: any) {
    const { data, error } = await db.from("clients").update(updates).eq("id", id).select().single()

    if (error) throw error
    return data
  },

  async delete(id: string) {
    const { error } = await db.from("clients").delete().eq("id", id)

    if (error) throw error
  },

  async getById(id: string) {
    const { data, error } = await db.from("clients").select("*").eq("id", id).single()

    if (error) throw error
    return data
  },
}

export const projectsService = {
  async getAll() {
    try {
      const { data, error } = await db
        .from("projects")
        .select(`
          *,
          clients (
            id,
            name
          )
        `)
        .order("name", { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Error fetching projects:", error)
      return []
    }
  },

  async create(project: any) {
    const { data, error } = await db.from("projects").insert(project).select().single()

    if (error) throw error
    return data
  },

  async update(id: string, updates: any) {
    const { data, error } = await db.from("projects").update(updates).eq("id", id).select().single()

    if (error) throw error
    return data
  },

  async delete(id: string) {
    const { error } = await db.from("projects").delete().eq("id", id)

    if (error) throw error
  },

  async getById(id: string) {
    const { data, error } = await db
      .from("projects")
      .select(`
        *,
        clients (
          id,
          name
        )
      `)
      .eq("id", id)
      .single()

    if (error) throw error
    return data
  },
}
