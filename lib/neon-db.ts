import { neon } from "@neondatabase/serverless"

// Load environment variables in non-Next.js environments
if (typeof window === 'undefined' && !process.env.NEXT_RUNTIME) {
  try {
    const dotenv = require('dotenv');
    dotenv.config({ path: '.env.local' });
  } catch (error) {
    // dotenv not available or not needed
  }
}

const databaseUrl = process.env.NEON_NEON_DATABASE_URL;

if (!databaseUrl) {
  throw new Error("NEON_NEON_DATABASE_URL environment variable is not set");
}

const sql = neon(databaseUrl);

export const clientsService = {
  async getAll() {
    try {
      const clients = await sql`
        SELECT id, name, email, phone, address, status, billing_terms, contract_details, created_at, updated_at
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
        INSERT INTO clients (name, email, phone, address, status, billing_terms, contract_details)
        VALUES (${client.name}, ${client.email}, ${client.phone}, ${client.address || ""}, ${client.status || "active"}, ${client.billing_terms || ""}, ${client.contract_details || ""})
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
          email = ${updates.email},
          phone = ${updates.phone},
          address = ${updates.address},
          status = ${updates.status},
          billing_terms = ${updates.billing_terms},
          contract_details = ${updates.contract_details},
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
      
      // Transform the data to match the expected Project type
      return projects.map(project => ({
        ...project,
        client: project.client_name || 'Unknown Client',
        clientId: project.client_id,
        startDate: project.start_date,
        deadline: project.end_date,
        manager: 'Unknown Manager', // Default since we don't have this in the database
        managerId: project.created_by || '',
        type: 'General', // Default since we don't have this in the database
        progress: 0, // Default since we don't have this in the database
      }))
    } catch (error) {
      console.error("Error fetching projects:", error)
      return []
    }
  },

  async create(project: any) {
    try {
      console.log("Creating project with data:", project)
      
      const [newProject] = await sql`
        INSERT INTO projects (
          name, 
          description, 
          client_id, 
          status, 
          estimated_budget, 
          actual_budget, 
          performance_points, 
          start_date, 
          end_date
        )
        VALUES (
          ${project.name},
          ${project.description || ''},
          ${project.client_id},
          ${project.status || 'draft'},
          ${parseFloat(project.estimated_budget) || parseFloat(project.budget) || 0},
          ${parseFloat(project.actual_budget) || 0},
          ${parseInt(project.performance_points) || 0},
          ${project.start_date},
          ${project.end_date || project.deadline}
        )
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
          estimated_budget = ${updates.estimated_budget || updates.budget || 0},
          actual_budget = ${updates.actual_budget || 0},
          performance_points = ${updates.performance_points || 0},
          start_date = ${updates.start_date},
          end_date = ${updates.end_date || updates.deadline},
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
          tm.*
        FROM team_members tm
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
      console.log('Creating team member with data:', teamMember)
      
      const [newTeamMember] = await sql`
        INSERT INTO team_members (
          name, title, department, bio, email, phone, location, 
          skills, achievements, social_linkedin, social_twitter, 
          social_github, social_portfolio, avatar_url, is_lead, is_active
        )
        VALUES (
          ${teamMember.name},
          ${teamMember.role || teamMember.title || 'Team Member'},
          ${teamMember.department},
          ${teamMember.bio || ''},
          ${teamMember.email},
          ${teamMember.phone || null},
          ${teamMember.location || ''},
          ${teamMember.skills || []},
          ${teamMember.achievements || []},
          ${teamMember.linkedin || teamMember.social_linkedin || null},
          ${teamMember.twitter || teamMember.social_twitter || null},
          ${teamMember.github || teamMember.social_github || null},
          ${teamMember.portfolio || teamMember.social_portfolio || null},
          ${teamMember.avatar || teamMember.avatar_url || null},
          ${teamMember.isLead || teamMember.is_lead || false},
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
          title = ${updates.title || updates.role},
          role = ${updates.role || updates.title},
          department = ${updates.department},
          phone = ${updates.phone},
          bio = ${updates.bio},
          skills = ${updates.skills || []},
          location = ${updates.location},
          social_linkedin = ${updates.linkedin || updates.social_linkedin},
          social_twitter = ${updates.twitter || updates.social_twitter},
          social_github = ${updates.social_github},
          social_portfolio = ${updates.social_portfolio},
          avatar_url = ${updates.avatar || updates.avatar_url},
          is_lead = ${updates.is_lead},
          is_active = ${updates.isActive !== undefined ? updates.isActive : updates.is_active},
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
        SELECT * FROM team_members WHERE id = ${id}
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

export const tasksService = {
  async getAll() {
    try {
      const tasks = await sql`
        SELECT 
          t.*,
          p.name as project_name,
          c.name as client_name,
          tm.name as assignee_name
        FROM tasks t
        LEFT JOIN projects p ON t.project_id = p.id
        LEFT JOIN clients c ON p.client_id = c.id
        LEFT JOIN team_members tm ON t.assigned_to = tm.id
        ORDER BY t.created_at DESC
      `
      return tasks
    } catch (error) {
      console.error("Error fetching tasks:", error)
      return []
    }
  },

  async create(task: any) {
    try {
      console.log("Creating task with data:", task)
      
      const [newTask] = await sql`
        INSERT INTO tasks (
          title, description, project_id, assigned_to, priority, 
          status, due_date, estimated_hours, is_content_related, dependencies
        )
        VALUES (
          ${task.title},
          ${task.description || ''},
          ${task.project_id},
          ${task.assigned_to || task.assignee_id},
          ${task.priority || 'medium'},
          ${task.status || 'backlog'},
          ${task.due_date},
          ${task.estimated_hours || null},
          ${task.is_content_related || false},
          ${task.dependencies || []}
        )
        RETURNING *
      `
      console.log("Successfully created task:", newTask)
      return newTask
    } catch (error) {
      console.error("Error creating task:", error)
      throw error
    }
  },

  async update(id: string, updates: any) {
    try {
      const [updatedTask] = await sql`
        UPDATE tasks 
        SET 
          title = ${updates.title},
          description = ${updates.description},
          project_id = ${updates.project_id},
          assigned_to = ${updates.assigned_to || updates.assignee_id},
          priority = ${updates.priority},
          status = ${updates.status},
          due_date = ${updates.due_date},
          estimated_hours = ${updates.estimated_hours},
          actual_hours = ${updates.actual_hours},
          is_content_related = ${updates.is_content_related},
          dependencies = ${updates.dependencies || []},
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `
      return updatedTask
    } catch (error) {
      console.error("Error updating task:", error)
      throw error
    }
  },

  async delete(id: string) {
    try {
      await sql`DELETE FROM tasks WHERE id = ${id}`
    } catch (error) {
      console.error("Error deleting task:", error)
      throw error
    }
  },

  async getById(id: string) {
    try {
      const [task] = await sql`
        SELECT 
          t.*,
          p.name as project_name,
          c.name as client_name,
          tm.name as assignee_name
        FROM tasks t
        LEFT JOIN projects p ON t.project_id = p.id
        LEFT JOIN clients c ON p.client_id = c.id
        LEFT JOIN team_members tm ON t.assigned_to = tm.id
        WHERE t.id = ${id}
      `
      return task
    } catch (error) {
      console.error("Error fetching task:", error)
      throw error
    }
  },

  async getByProject(projectId: string) {
    try {
      const tasks = await sql`
        SELECT 
          t.*,
          tm.name as assignee_name
        FROM tasks t
        LEFT JOIN team_members tm ON t.assigned_to = tm.id
        WHERE t.project_id = ${projectId}
        ORDER BY t.created_at DESC
      `
      return tasks
    } catch (error) {
      console.error("Error fetching tasks by project:", error)
      return []
    }
  }
}

export const invoicesService = {
  async getAll() {
    try {
      const invoices = await sql`
        SELECT 
          i.*,
          c.name as client_name,
          p.name as project_name
        FROM invoices i
        LEFT JOIN clients c ON i.client_id = c.id
        LEFT JOIN projects p ON i.project_id = p.id
        ORDER BY i.created_at DESC
      `
      return invoices
    } catch (error) {
      console.error("Error fetching invoices:", error)
      return []
    }
  },

  async create(invoice: any) {
    try {
      // Generate invoice number
      const invoiceNumber = `INV-${Date.now().toString().slice(-8)}`
      
      const [newInvoice] = await sql`
        INSERT INTO invoices (
          invoice_number, client_id, project_id, amount, tax, 
          discount, total, status, due_date, items, notes
        )
        VALUES (
          ${invoiceNumber},
          ${invoice.client_id},
          ${invoice.project_id},
          ${invoice.amount || 0},
          ${invoice.tax || 0},
          ${invoice.discount || 0},
          ${invoice.total || 0},
          ${invoice.status || 'draft'},
          ${invoice.due_date},
          ${JSON.stringify(invoice.items || [])},
          ${invoice.notes || ''}
        )
        RETURNING *
      `
      return newInvoice
    } catch (error) {
      console.error("Error creating invoice:", error)
      throw error
    }
  },

  async update(id: string, updates: any) {
    try {
      const [updatedInvoice] = await sql`
        UPDATE invoices 
        SET 
          client_id = ${updates.client_id},
          project_id = ${updates.project_id},
          amount = ${updates.amount},
          tax = ${updates.tax},
          discount = ${updates.discount},
          total = ${updates.total},
          status = ${updates.status},
          due_date = ${updates.due_date},
          items = ${JSON.stringify(updates.items || [])},
          notes = ${updates.notes},
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `
      return updatedInvoice
    } catch (error) {
      console.error("Error updating invoice:", error)
      throw error
    }
  },

  async delete(id: string) {
    try {
      await sql`DELETE FROM invoices WHERE id = ${id}`
    } catch (error) {
      console.error("Error deleting invoice:", error)
      throw error
    }
  },

  async getById(id: string) {
    try {
      const [invoice] = await sql`
        SELECT 
          i.*,
          c.name as client_name,
          p.name as project_name
        FROM invoices i
        LEFT JOIN clients c ON i.client_id = c.id
        LEFT JOIN projects p ON i.project_id = p.id
        WHERE i.id = ${id}
      `
      return invoice
    } catch (error) {
      console.error("Error fetching invoice:", error)
      throw error
    }
  }
}
