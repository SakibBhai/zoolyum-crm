# Task Management API

This document describes the implementation of the task management API endpoints for the CRM system.

## Overview

The task management system provides three core API endpoints:
1. **Edit Task** - `PUT /api/tasks/[taskId]` - Update existing tasks
2. **Delete Task** - `DELETE /api/tasks/[taskId]` - Delete a specific task
3. **Delete Last Task** - `DELETE /api/tasks/last` - Delete the most recently created task

## Database Schema

The tasks are stored in a PostgreSQL table with the following structure:

```sql
CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  priority VARCHAR(10) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  owner_id UUID NOT NULL
);
```

## Authentication

All endpoints require JWT authentication via the `Authorization` header:
```
Authorization: Bearer <jwt_token>
```

The JWT token must contain a `userId` claim that identifies the task owner.

## API Endpoints

### 1. Edit Task

**Endpoint:** `PUT /api/tasks/[taskId]`

**Description:** Updates an existing task with the provided fields.

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "title": "Updated task title",
  "description": "Updated description",
  "due_date": "2024-12-31T23:59:59.000Z",
  "priority": "high"
}
```

**Request Body Fields:**
- `title` (string, optional) - Task title
- `description` (string, optional) - Task description
- `due_date` (string, optional) - ISO 8601 formatted date string
- `priority` (string, optional) - One of: "low", "medium", "high"

**Response (200 OK):**
```json
{
  "id": 123,
  "title": "Updated task title",
  "description": "Updated description",
  "due_date": "2024-12-31T23:59:59.000Z",
  "priority": "high",
  "created_at": "2024-01-15T10:30:00.000Z",
  "updated_at": "2024-01-16T14:45:00.000Z",
  "owner_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid task ID, no updatable fields, or invalid field values
- `401 Unauthorized` - Missing or invalid JWT token
- `403 Forbidden` - User does not own the task
- `404 Not Found` - Task not found
- `500 Internal Server Error` - Database or runtime error

### 2. Delete Task

**Endpoint:** `DELETE /api/tasks/[taskId]`

**Description:** Deletes a specific task by its ID.

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Path Parameters:**
- `taskId` (required): The ID of the task to delete

**Response (200 OK):**
```json
{
  "message": "Task deleted successfully",
  "taskId": 123
}
```

**Error Responses:**
- `400 Bad Request` - Invalid task ID format
- `401 Unauthorized` - Missing or invalid JWT token
- `404 Not Found` - Task not found
- `500 Internal Server Error` - Database or runtime error

### 3. Delete Last Task

**Endpoint:** `DELETE /api/tasks/last`

**Description:** Deletes the most recently created task for the authenticated user.

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:** None

**Response (200 OK):**
```json
{
  "deletedTaskId": 123
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid JWT token
- `404 Not Found` - No tasks found for the user
- `500 Internal Server Error` - Database or runtime error

## Usage Examples

### Edit Task Example

```bash
curl -X PUT http://localhost:3000/api/tasks/123 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "title": "Updated Task Title",
    "priority": "high",
    "due_date": "2024-12-31T23:59:59.000Z"
  }'
```

### Delete Task Example

```bash
curl -X DELETE http://localhost:3000/api/tasks/123 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Delete Last Task Example

```bash
curl -X DELETE http://localhost:3000/api/tasks/last \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## Environment Variables

Ensure the following environment variables are set:

```env
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require
JWT_SECRET=your-jwt-secret-key
```

## Database Setup

1. Run the schema creation script:
```sql
-- Execute the contents of database/schema/tasks.sql
```

2. The schema includes:
   - Primary table structure
   - Performance indexes
   - Automatic timestamp updates
   - Data validation constraints

## File Structure

```
├── app/api/tasks/
│   ├── [taskId]/
│   │   └── route.ts          # Edit task endpoint
│   └── last/
│       └── route.ts          # Delete last task endpoint
├── lib/
│   ├── db.ts                 # Database connection and query helper
│   └── auth.ts               # JWT authentication utilities
├── models/
│   └── task.ts               # Task interface and types
└── database/schema/
    └── tasks.sql             # Database schema
```

## Security Considerations

1. **Authentication**: All endpoints require valid JWT tokens
2. **Authorization**: Users can only modify their own tasks
3. **Input Validation**: All inputs are validated before database operations
4. **SQL Injection Prevention**: Parameterized queries are used throughout
5. **Error Handling**: Sensitive information is not exposed in error messages

## Performance Optimizations

1. **Database Indexes**: Optimized for common query patterns
2. **Connection Pooling**: PostgreSQL connection pool for efficient resource usage
3. **Dynamic Queries**: Only update fields that are actually provided
4. **Minimal Data Transfer**: Return only necessary data in responses