# Database Setup for Team Management

This document provides instructions for setting up the database schema for the Team Management functionality in the Zoolyum CRM.

## Prerequisites

- Neon.tech PostgreSQL database account
- Database connection string configured in `.env.local`

## Environment Variables

Ensure your `.env.local` file contains:

```env
DATABASE_URL="postgresql://username:password@host/database?sslmode=require"
```

## Database Schema Setup

### 1. Execute the Schema

Run the SQL schema file in your Neon.tech database console:

psql -h $PGHOST -U $PGUSER -d $PGDATABASE -f database/schema/team_members.sql

   **Important:** If you have previously created the `team_members` table and are now updating it (e.g., adding new columns like `skills` or `department_id`), you might need to either:
   - Drop the existing `team_members` table (`DROP TABLE team_members CASCADE;`) before running the script to recreate it with the new schema. **Warning: This will delete all existing data in the table.**
   - Or, manually apply `ALTER TABLE` statements to add the missing columns if you want to preserve existing data. For example:
     ```sql
     ALTER TABLE team_members ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '[]'::jsonb;
     ALTER TABLE team_members ADD COLUMN IF NOT EXISTS department_id INTEGER REFERENCES departments(id);
     -- Add other missing columns as needed
     ```


### 2. Verify Tables

Verify that the `team_members` and `departments` tables are created successfully with all the correct columns (including `skills`, `department_id`, etc.). You can do this by connecting to your database using a SQL client (like `psql` or DBeaver) and inspecting the table structure (e.g., `\d team_members` in `psql`).

```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('team_members', 'departments');

-- Check team_members table structure
\d team_members;

-- Check departments table structure
\d departments;
```

## API Endpoints

### Team Members API

#### GET /api/team
Retrieve all active team members

**Response:**
```json
[
  {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "Software Engineer",
    "department": "Engineering",
    "phone": "+1234567890",
    "bio": "Experienced developer...",
    "skills": ["JavaScript", "React", "Node.js"],
    "avatar": "/placeholder-user.jpg",
    "linkedin": "https://linkedin.com/in/johndoe",
    "twitter": "@johndoe",
    "location": "New York, NY",
    "employee_id": "EMP123456",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
]
```

#### POST /api/team
Create a new team member

**Request Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "role": "Product Manager",
  "department": "Product",
  "phone": "+1234567891",
  "bio": "Product management expert...",
  "skills": ["Product Strategy", "Agile", "Analytics"],
  "location": "San Francisco, CA",
  "linkedin": "https://linkedin.com/in/janesmith",
  "twitter": "@janesmith"
}
```

**Response:**
```json
{
  "id": 2,
  "name": "Jane Smith",
  "email": "jane@example.com",
  "employee_id": "EMP789012",
  "created_at": "2024-01-01T00:00:00Z",
  // ... other fields
}
```

## Testing the Implementation

### 1. Frontend Testing

1. Navigate to `/dashboard/team`
2. Click "Add Team Member" button
3. Fill out the form with valid data
4. Submit and verify the new member appears in the list

### 2. API Testing

Using curl or Postman:

```powershell
# PowerShell commands
# Test GET endpoint
Invoke-RestMethod -Uri "http://localhost:3002/api/team" -Method GET

# Test POST endpoint
Invoke-RestMethod -Uri "http://localhost:3002/api/team" -Method POST -ContentType "application/json" -Body '{
  "name": "Test User",
  "email": "test@example.com",
  "role": "Developer",
  "department": "Engineering"
}'

# Alternative using curl (if available)
curl -X GET http://localhost:3002/api/team

curl -X POST http://localhost:3002/api/team \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "role": "Developer",
    "department": "Engineering"
  }'
```

### 3. Database Verification

Check the database directly:

```sql
-- View all team members
SELECT * FROM team_members ORDER BY created_at DESC;

-- Check for specific email
SELECT * FROM team_members WHERE email = 'test@example.com';

-- View departments
SELECT * FROM departments;
```

## Error Handling

### Common Issues

1. **Duplicate Email Error**
   - Error: `duplicate key value violates unique constraint`
   - Solution: Ensure email addresses are unique

2. **Missing Required Fields**
   - Error: `null value in column violates not-null constraint`
   - Solution: Ensure name, email, role, and department are provided

3. **Database Connection Error**
   - Error: `Error: DATABASE_URL environment variable is not set`
   - Solution: Check `.env.local` file and restart the development server

### Validation Rules

- **Name**: Required, non-empty string
- **Email**: Required, valid email format, unique
- **Role**: Required, non-empty string
- **Department**: Required, non-empty string
- **Phone**: Optional, string format
- **Skills**: Array of strings
- **Performance Rating**: Optional, decimal between 0 and 5

## Security Considerations

1. **Input Validation**: All inputs are validated on both client and server side
2. **SQL Injection Prevention**: Using parameterized queries with Neon SQL
3. **Email Uniqueness**: Enforced at database level
4. **Soft Deletes**: Team members are deactivated rather than deleted

## Maintenance

### Regular Tasks

1. **Backup**: Regular database backups through Neon.tech console
2. **Monitoring**: Check application logs for errors
3. **Performance**: Monitor query performance and add indexes as needed

### Schema Updates

When updating the schema:

1. Create migration scripts
2. Test in development environment
3. Apply to production during maintenance window
4. Update this documentation

## Support

For issues or questions:

1. Check application logs
2. Verify database connectivity
3. Review API endpoint responses
4. Check Neon.tech dashboard for database status