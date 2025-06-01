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
        ORDER BY p.created_at DESC
      `
      return projects
    } catch (error) {
      console.error("Error fetching projects:", error)
      return []
    }
  },

  async create(project: any) {
    try {
      const [newProject] = await sql`
        INSERT INTO projects (name, description, client_id, status, start_date, end_date, budget, team_members)
        VALUES (${project.name}, ${project.description}, ${project.client_id}, ${project.status || "planning"}, ${project.start_date}, ${project.end_date}, ${project.budget}, ${JSON.stringify(project.team_members || [])})
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
          description = ${updates.description},
          client_id = ${updates.client_id},
          status = ${updates.status},
          start_date = ${updates.start_date},
          end_date = ${updates.end_date},
          budget = ${updates.budget},
          team_members = ${JSON.stringify(updates.team_members || [])},
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

export const teamService = {
  async getAll() {
    try {
      const teamMembers = await sql`
        SELECT 
          tm.*,
          d.name as department_name
        FROM team_members tm
        LEFT JOIN departments d ON tm.department_id = d.id
        WHERE tm.is_active = true
        ORDER BY tm.name ASC
      `
      return teamMembers
    } catch (error) {
      console.error("Error fetching team members:", error)
      return []
    }
  },

  async create(teamMember: any) {
    try {
      // Generate employee ID
      const employeeId = `EMP${Date.now().toString().slice(-6)}`
      
      const [newTeamMember] = await sql`
        INSERT INTO team_members (
          name, email, role, department, phone, bio, skills, 
          avatar, linkedin, twitter, location, salary, employee_id, 
          manager, performance_rating, emergency_contact_name, 
          emergency_contact_relationship, emergency_contact_phone, 
          emergency_contact_email, is_active
        )
        VALUES (
          ${teamMember.name},
          ${teamMember.email},
          ${teamMember.role},
          ${teamMember.department},
          ${teamMember.phone || null},
          ${teamMember.bio || ''},
          ${JSON.stringify(teamMember.skills || [])},
          ${teamMember.avatar || '/placeholder-user.jpg'},
          ${teamMember.linkedin || null},
          ${teamMember.twitter || null},
          ${teamMember.location || ''},
          ${teamMember.salary || null},
          ${employeeId},
          ${teamMember.manager || null},
          ${teamMember.performanceRating || null},
          ${teamMember.emergencyContact?.name || null},
          ${teamMember.emergencyContact?.relationship || null},
          ${teamMember.emergencyContact?.phone || null},
          ${teamMember.emergencyContact?.email || null},
          ${teamMember.isActive !== false}
        )
        RETURNING *
      `
      return newTeamMember
    } catch (error) {
      console.error("Error creating team member:", error)
      throw error
    }
  },

  async update(id: string, updates: any) {
    try {
      const [updatedTeamMember] = await sql`
        UPDATE team_members 
        SET 
          name = ${updates.name},
          email = ${updates.email},
          role = ${updates.role},
          department = ${updates.department},
          department_id = ${updates.departmentId},
          phone = ${updates.phone},
          bio = ${updates.bio},
          skills = ${JSON.stringify(updates.skills || [])},
          avatar = ${updates.avatar},
          linkedin = ${updates.linkedin},
          twitter = ${updates.twitter},
          location = ${updates.location},
          salary = ${updates.salary},
          manager = ${updates.manager},
          performance_rating = ${updates.performanceRating},
          emergency_contact_name = ${updates.emergencyContact?.name},
          emergency_contact_relationship = ${updates.emergencyContact?.relationship},
          emergency_contact_phone = ${updates.emergencyContact?.phone},
          emergency_contact_email = ${updates.emergencyContact?.email},
          is_active = ${updates.isActive},
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `
      return updatedTeamMember
    } catch (error) {
      console.error("Error updating team member:", error)
      throw error
    }
  },

  async delete(id: string) {
    try {
      // Soft delete by setting is_active to false
      await sql`
        UPDATE team_members 
        SET is_active = false, updated_at = NOW() 
        WHERE id = ${id}
      `
    } catch (error) {
      console.error("Error deleting team member:", error)
      throw error
    }
  },

  async getById(id: string) {
    try {
      const [teamMember] = await sql`
        SELECT 
          tm.*,
          d.name as department_name
        FROM team_members tm
        LEFT JOIN departments d ON tm.department_id = d.id
        WHERE tm.id = ${id}
      `
      return teamMember
    } catch (error) {
      console.error("Error fetching team member:", error)
      throw error
    }
  },

  async getByEmail(email: string) {
    try {
      const [teamMember] = await sql`
        SELECT * FROM team_members WHERE email = ${email} AND is_active = true
      `
      return teamMember
    } catch (error) {
      console.error("Error fetching team member by email:", error)
      throw error
    }
  }
}
