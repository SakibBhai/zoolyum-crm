import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set')
}

const sql = neon(process.env.DATABASE_URL)

// POST /api/projects/[id]/recurring-tasks/generate
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id
    const now = new Date()
    
    // Get all active recurring tasks that are due for generation
    const recurringTasks = await sql`
      SELECT 
        id,
        project_id,
        title,
        description,
        frequency,
        interval_value as interval,
        days_of_week,
        day_of_month,
        start_date,
        end_date,
        next_due,
        assigned_to,
        priority,
        estimated_hours,
        tags,
        last_generated
      FROM recurring_tasks 
      WHERE project_id = ${projectId}
        AND is_active = true
        AND next_due <= ${now.toISOString()}
        AND (end_date IS NULL OR end_date >= ${now.toISOString()})
    `

    let generatedCount = 0
    const generatedTasks = []

    for (const task of recurringTasks) {
      try {
        // Check if a task for this due date already exists
        const existingTask = await sql`
          SELECT id FROM generated_tasks
          WHERE recurring_task_id = ${task.id}
            AND due_date::date = ${task.next_due.split('T')[0]}::date
        `

        if (existingTask.length === 0) {
          // Generate the new task
          const newTask = await sql`
            INSERT INTO generated_tasks (
              recurring_task_id,
              project_id,
              title,
              description,
              due_date,
              assigned_to,
              priority,
              estimated_hours,
              tags,
              status
            ) VALUES (
              ${task.id},
              ${task.project_id},
              ${task.title},
              ${task.description || null},
              ${task.next_due},
              ${task.assigned_to || null},
              ${task.priority},
              ${task.estimated_hours || null},
              ${task.tags || []},
              'pending'
            )
            RETURNING *
          `

          generatedTasks.push(newTask[0])
          generatedCount++
        }

        // Calculate the next due date
        const nextDue = calculateNextDue(task)
        
        // Update the recurring task with the new next_due date and last_generated timestamp
        await sql`
          UPDATE recurring_tasks
          SET 
            next_due = ${nextDue.toISOString()},
            last_generated = ${now.toISOString()}
          WHERE id = ${task.id}
        `
      } catch (taskError) {
        console.error(`Error generating task for recurring task ${task.id}:`, taskError)
        // Continue with other tasks even if one fails
      }
    }

    return NextResponse.json({
      message: `Generated ${generatedCount} tasks successfully`,
      count: generatedCount,
      tasks: generatedTasks
    })
  } catch (error) {
    console.error('Error generating tasks:', error)
    return NextResponse.json(
      { error: 'Failed to generate tasks' },
      { status: 500 }
    )
  }
}

// Helper function to calculate the next due date based on frequency
function calculateNextDue(task: any): Date {
  const currentDue = new Date(task.next_due)
  const interval = task.interval || 1

  switch (task.frequency) {
    case 'daily':
      return new Date(currentDue.getTime() + (interval * 24 * 60 * 60 * 1000))
    
    case 'weekly':
      const weeklyNext = new Date(currentDue)
      weeklyNext.setDate(weeklyNext.getDate() + (interval * 7))
      
      // If specific days of week are set, find the next occurrence
      if (task.days_of_week && task.days_of_week.length > 0) {
        const sortedDays = [...task.days_of_week].sort((a, b) => a - b)
        const currentDay = weeklyNext.getDay()
        
        // Find the next day in the current week
        let nextDay = sortedDays.find(day => day > currentDay)
        
        if (nextDay !== undefined) {
          // Next occurrence is in the current week
          const daysToAdd = nextDay - currentDay
          weeklyNext.setDate(weeklyNext.getDate() + daysToAdd)
        } else {
          // Next occurrence is in the next week cycle
          const daysToAdd = (7 - currentDay) + sortedDays[0]
          weeklyNext.setDate(weeklyNext.getDate() + daysToAdd)
        }
      }
      
      return weeklyNext
    
    case 'monthly':
      const monthlyNext = new Date(currentDue)
      monthlyNext.setMonth(monthlyNext.getMonth() + interval)
      
      // If specific day of month is set, use it
      if (task.day_of_month) {
        monthlyNext.setDate(task.day_of_month)
        
        // Handle cases where the day doesn't exist in the target month
        if (monthlyNext.getDate() !== task.day_of_month) {
          // Set to last day of the month
          monthlyNext.setDate(0)
        }
      }
      
      return monthlyNext
    
    case 'yearly':
      const yearlyNext = new Date(currentDue)
      yearlyNext.setFullYear(yearlyNext.getFullYear() + interval)
      return yearlyNext
    
    default:
      // Fallback: add one day
      return new Date(currentDue.getTime() + (24 * 60 * 60 * 1000))
  }
}

// GET /api/projects/[id]/recurring-tasks/generate - Get generation status
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id
    const now = new Date()
    
    // Get count of recurring tasks ready for generation
    const readyForGeneration = await sql`
      SELECT COUNT(*) as count
      FROM recurring_tasks 
      WHERE project_id = ${projectId}
        AND is_active = true
        AND next_due <= ${now.toISOString()}
        AND (end_date IS NULL OR end_date >= ${now.toISOString()})
    `

    // Get recent generation history
    const recentGenerations = await sql`
      SELECT 
        rt.title as recurring_task_title,
        gt.title,
        gt.due_date,
        gt.status,
        gt.created_at
      FROM generated_tasks gt
      JOIN recurring_tasks rt ON gt.recurring_task_id = rt.id
      WHERE gt.project_id = ${projectId}
      ORDER BY gt.created_at DESC
      LIMIT 10
    `

    return NextResponse.json({
      readyForGeneration: parseInt(readyForGeneration[0].count),
      recentGenerations
    })
  } catch (error) {
    console.error('Error getting generation status:', error)
    return NextResponse.json(
      { error: 'Failed to get generation status' },
      { status: 500 }
    )
  }
}