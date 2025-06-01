import { neon } from "@neondatabase/serverless"

// Use the DATABASE_URL environment variable
const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is not set")
}

const sql = neon(databaseUrl)

export const clientsService = {
  async getAll() {
    try {
      const clients = await sql`
        SELECT id, name, industry, contact_name, email, phone, status, notes, created_at, updated_at
        FROM clients 
        ORDER BY name ASC
      `
      return clients
    } catch (error) {
      console.error("Error fetching clients:", error)
      return []
    }
  },

  async create(client: any) {
    try {
      const [newClient] = await sql`
        INSERT INTO clients (name, industry, contact_name, email, phone, status, notes)
        VALUES (${client.name}, ${client.industry}, ${client.contact_name}, ${client.email}, ${client.phone}, ${client.status || "active"}, ${client.notes || ""})
        RETURNING *
      `
      return newClient
    } catch (error) {
      console.error("Error creating client:", error)
      throw error
    }
  },

  async update(id: string, updates: any) {
    try {
      const [updatedClient] = await sql`
        UPDATE clients 
        SET 
          name = ${updates.name},
          industry = ${updates.industry},
          contact_name = ${updates.contact_name},
          email = ${updates.email},
          phone = ${updates.phone},
          status = ${updates.status},
          notes = ${updates.notes},
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `
      return updatedClient
    } catch (error) {
      console.error("Error updating client:", error)
      throw error
    }
  },

  async delete(id: string) {
    try {
      await sql`DELETE FROM clients WHERE id = ${id}`
    } catch (error) {
      console.error("Error deleting client:", error)
      throw error
    }
  },

  async getById(id: string) {
    try {
      const [client] = await sql`
        SELECT * FROM clients WHERE id = ${id}
      `
      return client
    } catch (error) {
      console.error("Error fetching client:", error)
      throw error
    }
  },
}

export const projectsService = {
  async getAll() {
    try {
      const projects = await sql`
        SELECT 
          p.*,
          c.name as client_name
        FROM projects p
        LEFT JOIN clients c ON p.client_id = c.id
        ORDER BY p.name ASC
      `
      return projects
    } catch (error) {
      console.error("Error fetching projects:", error)
      return []
    }
  },

  async getByClientId(clientId: string) {
    try {
      const projects = await sql`
        SELECT 
          p.*,
          c.name as client_name
        FROM projects p
        LEFT JOIN clients c ON p.client_id = c.id
        WHERE p.client_id = ${clientId}
        ORDER BY p.created_at DESC
      `
      return projects
    } catch (error) {
      console.error("Error fetching projects for client:", error)
      return []
    }
  },

  async create(project: any) {
    try {
      const [newProject] = await sql`
        INSERT INTO projects (name, client_id, type, manager_id, start_date, deadline, status, description, progress, budget)
        VALUES (${project.name}, ${project.client_id}, ${project.type}, ${project.manager_id}, ${project.start_date}, ${project.deadline}, ${project.status || "not_started"}, ${project.description || ""}, ${project.progress || 0}, ${project.budget || null})
        RETURNING *
      `
      return newProject
    } catch (error) {
      console.error("Error creating project:", error)
      throw error
    }
  },

  async update(id: string, updates: any) {
    try {
      const [updatedProject] = await sql`
        UPDATE projects 
        SET 
          name = ${updates.name},
          client_id = ${updates.client_id},
          type = ${updates.type},
          manager_id = ${updates.manager_id},
          start_date = ${updates.start_date},
          deadline = ${updates.deadline},
          status = ${updates.status},
          description = ${updates.description},
          progress = ${updates.progress},
          budget = ${updates.budget},
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `
      return updatedProject
    } catch (error) {
      console.error("Error updating project:", error)
      throw error
    }
  },

  async delete(id: string) {
    try {
      await sql`DELETE FROM projects WHERE id = ${id}`
    } catch (error) {
      console.error("Error deleting project:", error)
      throw error
    }
  },

  async getById(id: string) {
    try {
      const [project] = await sql`
        SELECT 
          p.*,
          c.name as client_name
        FROM projects p
        LEFT JOIN clients c ON p.client_id = c.id
        WHERE p.id = ${id}
      `
      return project
    } catch (error) {
      console.error("Error fetching project:", error)
      throw error
    }
  },
}
