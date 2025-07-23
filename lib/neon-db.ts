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
const databaseUrl = process.env.DATABASE_URL || process.env.NEON_NEON_DATABASE_URL || process.env.NEON_DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    'Database URL not found. Please set one of the following environment variables: ' +
    'DATABASE_URL, NEON_NEON_DATABASE_URL, or NEON_DATABASE_URL'
  );
}

const sql = neon(databaseUrl);

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

  async getAllPaginated(params: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
    industry?: string;
    sortBy: string;
    sortOrder: string;
  }) {
    try {
      const offset = (params.page - 1) * params.limit

      // Build WHERE conditions
      let whereConditions = []
      let queryParams: any[] = []
      let paramIndex = 1

      if (params.search) {
        whereConditions.push(`(
          name ILIKE $${paramIndex} OR 
          industry ILIKE $${paramIndex} OR 
          contact_name ILIKE $${paramIndex} OR 
          email ILIKE $${paramIndex}
        )`)
        queryParams.push(`%${params.search}%`)
        paramIndex++
      }

      if (params.status && params.status !== 'all') {
        whereConditions.push(`status = $${paramIndex}`)
        queryParams.push(params.status)
        paramIndex++
      }

      if (params.industry) {
        whereConditions.push(`industry ILIKE $${paramIndex}`)
        queryParams.push(`%${params.industry}%`)
        paramIndex++
      }

      const whereClause = whereConditions.length > 0
        ? `WHERE ${whereConditions.join(' AND ')}`
        : ''

      // Validate sort column to prevent SQL injection
      const validSortColumns = ['name', 'created_at', 'updated_at', 'industry', 'status']
      const sortColumn = validSortColumns.includes(params.sortBy) ? params.sortBy : 'name'
      const sortDirection = params.sortOrder === 'desc' ? 'DESC' : 'ASC'

      // For now, let's use a simpler approach without complex filtering
      const countResult = await sql`SELECT COUNT(*) as total FROM clients`
      const total = countResult[0]?.total || 0

      // Get paginated results with basic sorting
      const clients = await sql`
        SELECT 
          id, name, industry, contact_name, email, phone, status, notes, 
          created_at, updated_at,
          (
            SELECT COUNT(*) 
            FROM projects p 
            WHERE p.client_id = clients.id
          ) as project_count
        FROM clients
        ORDER BY name ASC
        LIMIT ${params.limit} OFFSET ${offset}
      `

      return {
        clients,
        total: parseInt(total.toString())
      }
    } catch (error) {
      console.error("Error fetching paginated clients:", error)
      return {
        clients: [],
        total: 0
      }
    }
  },

  async getClientStats() {
    try {
      const stats = await sql`
        SELECT 
          COUNT(*) as total_clients,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_clients,
          COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_clients,
          COUNT(CASE WHEN status = 'prospect' THEN 1 END) as prospect_clients,
          COUNT(DISTINCT industry) as unique_industries
        FROM clients
      `
      return stats[0]
    } catch (error) {
      console.error("Error fetching client stats:", error)
      return {
        total_clients: 0,
        active_clients: 0,
        inactive_clients: 0,
        prospect_clients: 0,
        unique_industries: 0
      }
    }
  },

  async getIndustries() {
    try {
      const industries = await sql`
        SELECT DISTINCT industry
        FROM clients
        WHERE industry IS NOT NULL AND industry != ''
        ORDER BY industry ASC
      `
      return industries.map(row => row.industry)
    } catch (error) {
      console.error("Error fetching industries:", error)
      return []
    }
  },

  async create(client: any) {
    try {
      const [newClient] = await sql`
        INSERT INTO clients (name, industry, contact_name, email, phone, status, notes)
        VALUES (${client.name}, ${client.industry || ""}, ${client.contactName || client.contact_name || ""}, ${client.email}, ${client.phone}, ${client.status || "active"}, ${client.notes || ""})
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
        industry: updates.industry !== undefined ? updates.industry : currentClient.industry,
        contact_name: updates.contactName !== undefined ? updates.contactName : (updates.contact_name !== undefined ? updates.contact_name : currentClient.contact_name),
        email: updates.email !== undefined ? updates.email : currentClient.email,
        phone: updates.phone !== undefined ? updates.phone : currentClient.phone,
        status: updates.status !== undefined ? updates.status : currentClient.status,
        notes: updates.notes !== undefined ? updates.notes : currentClient.notes,
      }

      // Update with merged data
      const [updatedClient] = await sql`
        UPDATE clients 
        SET 
          name = ${updatedData.name},
          industry = ${updatedData.industry},
          contact_name = ${updatedData.contact_name},
          email = ${updatedData.email},
          phone = ${updatedData.phone},
          status = ${updatedData.status},
          notes = ${updatedData.notes},
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
        id: project.id,
        client: project.client_name || 'Unknown Client',
        clientId: project.client_id,
        startDate: project.start_date,
        deadline: project.end_date,
        manager: project.manager || 'Unknown Manager',
        managerId: project.created_by || '',
        type: project.type || 'General',
        progress: project.progress || 0,
        status: project.status || 'draft',
        priority: project.priority || 'medium'
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
          priority,
          type,
          start_date, 
          end_date,
          budget,
          estimated_budget,
          progress,
          manager,
          created_by
        )
        VALUES (
          ${project.name},
          ${project.description || ''},
          ${project.client_id || null},
          ${project.status || 'planning'},
          ${project.priority || 'medium'},
          ${project.type || 'general'},
          ${project.start_date || null},
          ${project.end_date || project.deadline || null},
          ${parseFloat(project.budget) || 0},
          ${parseFloat(project.estimated_budget) || parseFloat(project.budget) || 0},
          ${project.progress || 0},
          ${project.manager || null},
          ${project.created_by || null}
        )
        RETURNING *
      `

      // Log project creation activity if logActivity method exists
      try {
        if (newProject) {
          await this.logActivity(newProject.id, 'created', `Project "${project.name}" was created`, project.created_by, 'System');
        }
      } catch (activityError) {
        console.warn('Could not log project creation activity:', activityError);
      }

      return newProject
    } catch (error) {
      console.error("Error creating project:", error)
      throw error
    }
  },

  async update(id: string, updates: any, updatedBy?: string) {
    try {
      const oldProject = await this.getById(id);

      const [updatedProject] = await sql`
        UPDATE projects 
        SET 
          name = ${updates.name},
          description = ${updates.description},
          client_id = ${updates.client_id},
          status = ${updates.status},
          priority = ${updates.priority},
          estimated_budget = ${updates.estimated_budget || updates.budget || 0},
          actual_budget = ${updates.actual_budget || 0},
          performance_points = ${updates.performance_points || 0},
          start_date = ${updates.start_date},
          end_date = ${updates.end_date || updates.deadline},
          manager = ${updates.manager},
          type = ${updates.type},
          progress = ${updates.progress},
          team_members = ${JSON.stringify(updates.team_members || [])},
          tags = ${JSON.stringify(updates.tags || [])},
          recurrence_pattern = ${updates.recurrence_pattern ? JSON.stringify(updates.recurrence_pattern) : null},
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `

      // Log status change activity
      if (oldProject && oldProject.status !== updates.status) {
        await this.logActivity(id, 'status_changed', `Project status changed from "${oldProject.status}" to "${updates.status}"`, updatedBy);
      }

      // Log general update activity
      await this.logActivity(id, 'updated', `Project "${updates.name}" was updated`, updatedBy);

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

  async logActivity(projectId: string, type: string, description: string, userId?: string, userName?: string) {
    try {
      const [newActivity] = await sql`
        INSERT INTO project_activities (
          project_id, type, description, user_id, user_name, timestamp
        )
        VALUES (
          ${projectId}, ${type}, ${description}, ${userId || null}, ${userName || null}, NOW()
        )
        RETURNING *
      `
      return newActivity
    } catch (error) {
      console.error("Error logging project activity:", error)
      throw error
    }
  },

  async getActivities(projectId: string, limit: number = 50) {
    try {
      const activities = await sql`
        SELECT * FROM project_activities 
        WHERE project_id = ${projectId}
        ORDER BY timestamp DESC
        LIMIT ${limit}
      `
      return activities
    } catch (error) {
      console.error("Error fetching project activities:", error)
      return []
    }
  },

  async addTeamMember(projectId: string, teamMemberId: string, addedBy?: string) {
    try {
      const project = await this.getById(projectId);
      const teamMembers = project.team_members || [];

      if (!teamMembers.find((member: any) => member.id === teamMemberId)) {
        const teamMember = await teamService.getById(teamMemberId);

        if (teamMember) {
          teamMembers.push(teamMember);

          await sql`
            UPDATE projects 
            SET team_members = ${JSON.stringify(teamMembers)}, updated_at = NOW()
            WHERE id = ${projectId}
          `;

          await this.logActivity(projectId, 'team_member_added', `${(teamMember as any).name} was added to the project`, addedBy);
        }
      }
    } catch (error) {
      console.error("Error adding team member to project:", error)
      throw error
    }
  },

  async removeTeamMember(projectId: string, teamMemberId: string, removedBy?: string) {
    try {
      const project = await this.getById(projectId);
      const teamMembers = project.team_members || [];
      const memberToRemove = teamMembers.find((member: any) => member.id === teamMemberId);

      if (memberToRemove) {
        const updatedTeamMembers = teamMembers.filter((member: any) => member.id !== teamMemberId);

        await sql`
          UPDATE projects 
          SET team_members = ${JSON.stringify(updatedTeamMembers)}, updated_at = NOW()
          WHERE id = ${projectId}
        `;

        await this.logActivity(projectId, 'team_member_removed', `${memberToRemove.name} was removed from the project`, removedBy);
      }
    } catch (error) {
      console.error("Error removing team member from project:", error)
      throw error
    }
  },

  async addDocument(projectId: string, documentData: any, uploadedBy?: string) {
    try {
      await this.logActivity(projectId, 'document_uploaded', `Document "${documentData.originalName}" was uploaded`, uploadedBy);
    } catch (error) {
      console.error("Error logging document upload:", error)
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
        role: member.role,
        department: member.department,
        active: member.is_active,
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

export const transactionsService = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    type?: string;
    category?: string;
    dateFrom?: string;
    dateTo?: string;
    projectId?: string;
    clientId?: string;
    sortBy?: string;
    sortOrder?: string;
  }) {
    try {
      const page = params?.page || 1
      const limit = params?.limit || 50
      const offset = (page - 1) * limit

      let whereConditions = []
      let queryParams: any[] = []

      if (params?.type && params.type !== 'all') {
        whereConditions.push(`type = '${params.type}'`)
      }

      if (params?.category) {
        whereConditions.push(`category ILIKE '%${params.category}%'`)
      }

      if (params?.dateFrom) {
        whereConditions.push(`date >= '${params.dateFrom}'`)
      }

      if (params?.dateTo) {
        whereConditions.push(`date <= '${params.dateTo}'`)
      }

      if (params?.projectId) {
        whereConditions.push(`project_id = '${params.projectId}'`)
      }

      if (params?.clientId) {
        whereConditions.push(`client_id = '${params.clientId}'`)
      }

      const whereClause = whereConditions.length > 0
        ? `WHERE ${whereConditions.join(' AND ')}`
        : ''

      const validSortColumns = ['date', 'amount', 'category', 'type', 'created_at']
      const sortColumn = validSortColumns.includes(params?.sortBy || '') ? params?.sortBy : 'date'
      const sortDirection = params?.sortOrder === 'asc' ? 'ASC' : 'DESC'

      const transactions = await sql`
        SELECT 
          t.*,
          p.name as project_name,
          c.name as client_name
        FROM transactions t
        LEFT JOIN projects p ON t.project_id = p.id
        LEFT JOIN clients c ON t.client_id = c.id
        ${whereClause ? sql.unsafe(whereClause) : sql``}
        ORDER BY ${sql.unsafe(sortColumn as string)} ${sql.unsafe(sortDirection as string)}
        LIMIT ${limit} OFFSET ${offset}
      `

      const countResult = await sql`
        SELECT COUNT(*) as total 
        FROM transactions t
        ${whereClause ? sql.unsafe(whereClause) : sql``}
      `

      return {
        transactions,
        total: parseInt(countResult[0]?.total?.toString() || '0'),
        page,
        limit
      }
    } catch (error) {
      console.error("Error fetching transactions:", error)
      return {
        transactions: [],
        total: 0,
        page: 1,
        limit: 50
      }
    }
  },

  async create(transaction: any) {
    try {
      const [newTransaction] = await sql`
        INSERT INTO transactions (
          type, amount, category, description, date,
          project_id, client_id, invoice_id, receipt_url,
          tax_amount, tax_rate, payment_method, reference_number,
          notes, tags, is_recurring, recurring_frequency,
          recurring_end_date, status, created_by
        )
        VALUES (
          ${transaction.type},
          ${transaction.amount},
          ${transaction.category},
          ${transaction.description},
          ${transaction.date},
          ${transaction.project_id || null},
          ${transaction.client_id || null},
          ${transaction.invoice_id || null},
          ${transaction.receipt_url || null},
          ${transaction.tax_amount || 0},
          ${transaction.tax_rate || 0},
          ${transaction.payment_method || null},
          ${transaction.reference_number || null},
          ${transaction.notes || null},
          ${transaction.tags || []},
          ${transaction.is_recurring || false},
          ${transaction.recurring_frequency || null},
          ${transaction.recurring_end_date || null},
          ${transaction.status || 'completed'},
          ${transaction.created_by || null}
        )
        RETURNING *
      `
      return newTransaction
    } catch (error) {
      console.error("Error creating transaction:", error)
      throw error
    }
  },

  async update(id: string, updates: any) {
    try {
      const [currentTransaction] = await sql`SELECT * FROM transactions WHERE id = ${id}`

      if (!currentTransaction) {
        throw new Error("Transaction not found")
      }

      const updatedData = {
        type: updates.type !== undefined ? updates.type : currentTransaction.type,
        amount: updates.amount !== undefined ? updates.amount : currentTransaction.amount,
        category: updates.category !== undefined ? updates.category : currentTransaction.category,
        description: updates.description !== undefined ? updates.description : currentTransaction.description,
        date: updates.date !== undefined ? updates.date : currentTransaction.date,
        project_id: updates.project_id !== undefined ? updates.project_id : currentTransaction.project_id,
        client_id: updates.client_id !== undefined ? updates.client_id : currentTransaction.client_id,
        invoice_id: updates.invoice_id !== undefined ? updates.invoice_id : currentTransaction.invoice_id,
        receipt_url: updates.receipt_url !== undefined ? updates.receipt_url : currentTransaction.receipt_url,
        tax_amount: updates.tax_amount !== undefined ? updates.tax_amount : currentTransaction.tax_amount,
        tax_rate: updates.tax_rate !== undefined ? updates.tax_rate : currentTransaction.tax_rate,
        payment_method: updates.payment_method !== undefined ? updates.payment_method : currentTransaction.payment_method,
        reference_number: updates.reference_number !== undefined ? updates.reference_number : currentTransaction.reference_number,
        notes: updates.notes !== undefined ? updates.notes : currentTransaction.notes,
        tags: updates.tags !== undefined ? updates.tags : currentTransaction.tags,
        status: updates.status !== undefined ? updates.status : currentTransaction.status
      }

      const [updatedTransaction] = await sql`
        UPDATE transactions 
        SET 
          type = ${updatedData.type},
          amount = ${updatedData.amount},
          category = ${updatedData.category},
          description = ${updatedData.description},
          date = ${updatedData.date},
          project_id = ${updatedData.project_id},
          client_id = ${updatedData.client_id},
          invoice_id = ${updatedData.invoice_id},
          receipt_url = ${updatedData.receipt_url},
          tax_amount = ${updatedData.tax_amount},
          tax_rate = ${updatedData.tax_rate},
          payment_method = ${updatedData.payment_method},
          reference_number = ${updatedData.reference_number},
          notes = ${updatedData.notes},
          tags = ${updatedData.tags},
          status = ${updatedData.status},
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `
      return updatedTransaction
    } catch (error) {
      console.error("Error updating transaction:", error)
      throw error
    }
  },

  async delete(id: string) {
    try {
      await sql`DELETE FROM transactions WHERE id = ${id}`
    } catch (error) {
      console.error("Error deleting transaction:", error)
      throw error
    }
  },

  async getById(id: string) {
    try {
      const [transaction] = await sql`
        SELECT 
          t.*,
          p.name as project_name,
          c.name as client_name
        FROM transactions t
        LEFT JOIN projects p ON t.project_id = p.id
        LEFT JOIN clients c ON t.client_id = c.id
        WHERE t.id = ${id}
      `
      return transaction
    } catch (error) {
      console.error("Error fetching transaction:", error)
      throw error
    }
  },

  async getFinancialSummary(params?: {
    dateFrom?: string;
    dateTo?: string;
    projectId?: string;
    clientId?: string;
  }) {
    try {
      let whereConditions = ["status = 'completed'"]

      if (params?.dateFrom) {
        whereConditions.push(`date >= '${params.dateFrom}'`)
      }

      if (params?.dateTo) {
        whereConditions.push(`date <= '${params.dateTo}'`)
      }

      if (params?.projectId) {
        whereConditions.push(`project_id = '${params.projectId}'`)
      }

      if (params?.clientId) {
        whereConditions.push(`client_id = '${params.clientId}'`)
      }

      const whereClause = `WHERE ${whereConditions.join(' AND ')}`

      const summary = await sql`
        SELECT 
          SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
          SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expenses,
          SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) as net_amount,
          COUNT(CASE WHEN type = 'income' THEN 1 END) as income_count,
          COUNT(CASE WHEN type = 'expense' THEN 1 END) as expense_count
        FROM transactions
        ${sql.unsafe(whereClause)}
      `

      return summary[0] || {
        total_income: 0,
        total_expenses: 0,
        net_amount: 0,
        income_count: 0,
        expense_count: 0
      }
    } catch (error) {
      console.error("Error fetching financial summary:", error)
      return {
        total_income: 0,
        total_expenses: 0,
        net_amount: 0,
        income_count: 0,
        expense_count: 0
      }
    }
  },

  async getMonthlyTotals(year?: number) {
    try {
      const yearFilter = year ? `WHERE EXTRACT(YEAR FROM date) = ${year}` : ''

      const monthlyData = await sql`
        SELECT 
          DATE_TRUNC('month', date) as month,
          SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
          SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expenses,
          SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) as net_amount
        FROM transactions 
        WHERE status = 'completed' ${year ? `AND EXTRACT(YEAR FROM date) = ${year}` : ''}
        GROUP BY DATE_TRUNC('month', date)
        ORDER BY month DESC
        LIMIT 12
      `

      return monthlyData
    } catch (error) {
      console.error("Error fetching monthly totals:", error)
      return []
    }
  },

  async getCategories(type?: 'income' | 'expense') {
    try {
      const typeFilter = type ? `WHERE type = '${type}'` : ''

      const categories = await sql`
        SELECT 
          category,
          type,
          COUNT(*) as transaction_count,
          SUM(amount) as total_amount
        FROM transactions
        ${type ? sql.unsafe(typeFilter) : sql``}
        GROUP BY category, type
        ORDER BY total_amount DESC
      `

      return categories
    } catch (error) {
      console.error("Error fetching categories:", error)
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
