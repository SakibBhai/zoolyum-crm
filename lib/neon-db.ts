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

// Use DATABASE_URL (Prisma standard) with fallback to legacy variable
const databaseUrl = process.env.DATABASE_URL || process.env.NEON_NEON_DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is not set. Please check your environment configuration.");
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
      // First get the current client data
      const [currentClient] = await sql`SELECT * FROM clients WHERE id = ${id}`
      
      if (!currentClient) {
        throw new Error("Client not found")
      }
      
      // Merge the updates with current data
      const updatedData = {
        name: updates.name !== undefined ? updates.name : currentClient.name,
        email: updates.email !== undefined ? updates.email : currentClient.email,
        phone: updates.phone !== undefined ? updates.phone : currentClient.phone,
        address: updates.address !== undefined ? updates.address : currentClient.address,
        status: updates.status !== undefined ? updates.status : currentClient.status,
        billing_terms: updates.billing_terms !== undefined ? updates.billing_terms : currentClient.billing_terms,
        contract_details: updates.contract_details !== undefined ? updates.contract_details : currentClient.contract_details,
      }
      
      // Update with merged data
      const [updatedClient] = await sql`
        UPDATE clients 
        SET 
          name = ${updatedData.name},
          email = ${updatedData.email},
          phone = ${updatedData.phone},
          address = ${updatedData.address},
          status = ${updatedData.status},
          billing_terms = ${updatedData.billing_terms},
          contract_details = ${updatedData.contract_details},
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

  async createProjectVersionHistory(versionData: any) {
    try {
      const [newVersion] = await sql`
        INSERT INTO project_version_history (
          project_id,
          changed_fields,
          previous_values,
          new_values,
          changed_by,
          change_reason
        )
        VALUES (
          ${versionData.project_id},
          ${JSON.stringify(versionData.changed_fields)},
          ${versionData.previous_values},
          ${versionData.new_values},
          ${versionData.changed_by || 'system'},
          ${versionData.change_reason || 'Project updated'}
        )
        RETURNING *
      `
      return newVersion
    } catch (error) {
      console.error("Error creating project version history:", error)
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
      
      // Transform database response to match TypeScript interface
      return teamMembers.map(member => ({
        ...member,
        skills: typeof member.skills === 'string' ? JSON.parse(member.skills) : (member.skills || []),
        emergencyContact: member.emergency_contact_name ? {
          name: member.emergency_contact_name,
          relationship: member.emergency_contact_relationship,
          phone: member.emergency_contact_phone,
          email: member.emergency_contact_email
        } : undefined,
        employeeId: member.employee_id,
        performanceRating: member.performance_rating,
        joinDate: member.created_at
      }))
    } catch (error) {
      console.error("Error fetching team members:", error)
      return []
    }
  },

  async create(teamMember: any) {
    try {
      console.log('Creating team member with data:', teamMember)
      
      // Generate a unique employee_id if not provided
      const employeeId = teamMember.employee_id || `EMP-${Date.now().toString().slice(-6)}`
      
      const [newTeamMember] = await sql`
        INSERT INTO team_members (
          name, role, department, bio, email, phone, location, 
          skills, linkedin, twitter, avatar, employee_id, is_active
        )
        VALUES (
          ${teamMember.name},
          ${teamMember.role || 'Team Member'},
          ${teamMember.department},
          ${teamMember.bio || ''},
          ${teamMember.email},
          ${teamMember.phone || null},
          ${teamMember.location || ''},
          ${JSON.stringify(teamMember.skills || [])},
          ${teamMember.linkedin || null},
          ${teamMember.twitter || null},
          ${teamMember.avatar || '/placeholder-user.jpg'},
          ${employeeId},
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
      // First, get the current team member to preserve existing values
      const [currentMember] = await sql`SELECT * FROM team_members WHERE id = ${id}`
      if (!currentMember) {
        throw new Error('Team member not found')
      }
      
      // Handle emergency contact object if provided
      let emergencyContactUpdates = {}
      if (updates.emergencyContact) {
        emergencyContactUpdates = {
          emergency_contact_name: updates.emergencyContact.name,
          emergency_contact_relationship: updates.emergencyContact.relationship,
          emergency_contact_phone: updates.emergencyContact.phone,
          emergency_contact_email: updates.emergencyContact.email
        }
      }
      
      // Merge updates with current values, only updating provided fields
      const updatedData = {
        name: updates.name !== undefined ? updates.name : currentMember.name,
        email: updates.email !== undefined ? updates.email : currentMember.email,
        role: updates.role !== undefined ? updates.role : currentMember.role,
        department: updates.department !== undefined ? updates.department : currentMember.department,
        phone: updates.phone !== undefined ? updates.phone : currentMember.phone,
        bio: updates.bio !== undefined ? updates.bio : currentMember.bio,
        skills: updates.skills !== undefined ? JSON.stringify(updates.skills) : currentMember.skills,
        location: updates.location !== undefined ? updates.location : currentMember.location,
        linkedin: updates.linkedin !== undefined ? updates.linkedin : currentMember.linkedin,
        twitter: updates.twitter !== undefined ? updates.twitter : currentMember.twitter,
        avatar: (updates.avatar !== undefined || updates.avatar_url !== undefined) ? 
                (updates.avatar || updates.avatar_url) : currentMember.avatar,
        salary: updates.salary !== undefined ? updates.salary : currentMember.salary,
        employee_id: updates.employeeId !== undefined ? updates.employeeId : 
                     (updates.employee_id !== undefined ? updates.employee_id : currentMember.employee_id),
        manager: updates.manager !== undefined ? updates.manager : currentMember.manager,
        performance_rating: updates.performanceRating !== undefined ? updates.performanceRating : 
                           (updates.performance_rating !== undefined ? updates.performance_rating : currentMember.performance_rating),
        emergency_contact_name: ('emergency_contact_name' in emergencyContactUpdates) ?
                               emergencyContactUpdates.emergency_contact_name : 
                               (updates.emergency_contact_name !== undefined ? updates.emergency_contact_name : currentMember.emergency_contact_name),
        emergency_contact_relationship: ('emergency_contact_relationship' in emergencyContactUpdates) ?
                                       emergencyContactUpdates.emergency_contact_relationship : 
                                       (updates.emergency_contact_relationship !== undefined ? updates.emergency_contact_relationship : currentMember.emergency_contact_relationship),
        emergency_contact_phone: ('emergency_contact_phone' in emergencyContactUpdates) ?
                                emergencyContactUpdates.emergency_contact_phone : 
                                (updates.emergency_contact_phone !== undefined ? updates.emergency_contact_phone : currentMember.emergency_contact_phone),
        emergency_contact_email: ('emergency_contact_email' in emergencyContactUpdates) ?
                                emergencyContactUpdates.emergency_contact_email : 
                                (updates.emergency_contact_email !== undefined ? updates.emergency_contact_email : currentMember.emergency_contact_email),
        is_active: (updates.isActive !== undefined || updates.is_active !== undefined) ? 
                   (updates.isActive !== undefined ? updates.isActive : updates.is_active) : currentMember.is_active,
        status: updates.status !== undefined ? updates.status : currentMember.status
      }
      
      console.log('Updating team member with data:', updatedData)
      
      const [updatedTeamMember] = await sql`
        UPDATE team_members 
        SET 
          name = ${updatedData.name},
          email = ${updatedData.email},
          role = ${updatedData.role},
          department = ${updatedData.department},
          phone = ${updatedData.phone},
          bio = ${updatedData.bio},
          skills = ${updatedData.skills},
          location = ${updatedData.location},
          linkedin = ${updatedData.linkedin},
          twitter = ${updatedData.twitter},
          avatar = ${updatedData.avatar},
          salary = ${updatedData.salary},
          employee_id = ${updatedData.employee_id},
          manager = ${updatedData.manager},
          performance_rating = ${updatedData.performance_rating},
          emergency_contact_name = ${updatedData.emergency_contact_name},
          emergency_contact_relationship = ${updatedData.emergency_contact_relationship},
          emergency_contact_phone = ${updatedData.emergency_contact_phone},
          emergency_contact_email = ${updatedData.emergency_contact_email},
          is_active = ${updatedData.is_active},
          status = ${updatedData.status},
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `
      
      // Transform the database response to match the TypeScript interface
      const transformedMember = {
        ...updatedTeamMember,
        skills: typeof updatedTeamMember.skills === 'string' ? 
                JSON.parse(updatedTeamMember.skills) : updatedTeamMember.skills,
        emergencyContact: updatedTeamMember.emergency_contact_name ? {
          name: updatedTeamMember.emergency_contact_name,
          relationship: updatedTeamMember.emergency_contact_relationship,
          phone: updatedTeamMember.emergency_contact_phone,
          email: updatedTeamMember.emergency_contact_email
        } : undefined,
        employeeId: updatedTeamMember.employee_id,
        performanceRating: updatedTeamMember.performance_rating,
        joinDate: updatedTeamMember.created_at
      }
      
      console.log('Successfully updated team member:', transformedMember)
      return transformedMember
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
      
      if (!teamMember) {
        return null
      }
      
      // Transform database response to match TypeScript interface
      return {
        ...teamMember,
        skills: typeof teamMember.skills === 'string' ? JSON.parse(teamMember.skills) : (teamMember.skills || []),
        emergencyContact: teamMember.emergency_contact_name ? {
          name: teamMember.emergency_contact_name,
          relationship: teamMember.emergency_contact_relationship,
          phone: teamMember.emergency_contact_phone,
          email: teamMember.emergency_contact_email
        } : undefined,
        employeeId: teamMember.employee_id,
        performanceRating: teamMember.performance_rating,
        joinDate: teamMember.created_at
      }
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
      // First get the current task data to preserve existing values
      const [currentTask] = await sql`SELECT * FROM tasks WHERE id = ${id}`
      
      if (!currentTask) {
        throw new Error("Task not found")
      }
      
      // Map frontend field names to database field names and merge with current data
      const updatedData = {
        title: updates.title !== undefined ? updates.title : 
               (updates.name !== undefined ? updates.name : currentTask.title),
        description: updates.description !== undefined ? updates.description : 
                    (updates.details !== undefined ? updates.details : 
                     (updates.brief !== undefined ? updates.brief : currentTask.description)),
        project_id: updates.project_id !== undefined ? updates.project_id : 
                   (updates.projectId !== undefined ? updates.projectId : currentTask.project_id),
        assigned_to: updates.assigned_to !== undefined ? updates.assigned_to : 
                    (updates.assignedTo !== undefined ? updates.assignedTo : 
                     (updates.assignee_id !== undefined ? updates.assignee_id : currentTask.assigned_to)),
        priority: updates.priority !== undefined ? updates.priority : currentTask.priority,
        status: updates.status !== undefined ? updates.status : currentTask.status,
        due_date: updates.due_date !== undefined ? updates.due_date : 
                 (updates.dueDate !== undefined ? updates.dueDate : currentTask.due_date),
        estimated_hours: updates.estimated_hours !== undefined ? updates.estimated_hours : currentTask.estimated_hours,
        actual_hours: updates.actual_hours !== undefined ? updates.actual_hours : currentTask.actual_hours,
        is_content_related: updates.is_content_related !== undefined ? updates.is_content_related : 
                           (updates.category === 'content' ? true : currentTask.is_content_related),
        dependencies: updates.dependencies !== undefined ? updates.dependencies : currentTask.dependencies
      }
      
      const [updatedTask] = await sql`
        UPDATE tasks 
        SET 
          title = ${updatedData.title},
          description = ${updatedData.description},
          project_id = ${updatedData.project_id},
          assigned_to = ${updatedData.assigned_to},
          priority = ${updatedData.priority},
          status = ${updatedData.status},
          due_date = ${updatedData.due_date},
          estimated_hours = ${updatedData.estimated_hours},
          actual_hours = ${updatedData.actual_hours},
          is_content_related = ${updatedData.is_content_related},
          dependencies = ${updatedData.dependencies || []},
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
