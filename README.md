# Zoolyum CRM

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/sakibbhais-projects/v0-crm-entity-structure)
[![Built with Next.js](https://img.shields.io/badge/Built%20with-Next.js%2015-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)](https://prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

## 🚀 Overview

Zoolyum CRM is a modern, full-stack Customer Relationship Management system built with Next.js 15, TypeScript, and PostgreSQL. Designed for scalability and performance, it provides comprehensive tools for managing clients, projects, tasks, team members, and invoicing workflows.

## ✨ Features

### 📊 Dashboard & Analytics
- Real-time performance metrics and KPI tracking
- Interactive charts and data visualizations
- Project progress monitoring
- Revenue and budget analytics

### 👥 Client Management
- Complete client profiles with contact information
- Industry categorization and status tracking
- Client project history and relationship mapping
- Advanced search and filtering capabilities

### 📋 Project Management
- Project lifecycle management (planning to completion)
- Budget tracking and resource allocation
- Team member assignment and collaboration
- Recurring project templates
- Version history and change tracking

### ✅ Task Management
- Task creation, assignment, and tracking
- Priority levels and deadline management
- Task dependencies and workflow automation
- Progress reporting and status updates

### 👨‍💼 Team Management
- Employee profiles with skills and department tracking
- Role-based access control
- Performance metrics and ratings
- Department organization and hierarchy

### 💰 Invoice Management
- Invoice generation and customization
- Recurring billing automation
- Payment tracking and status management
- PDF export and email delivery
- Financial reporting and analytics

### 📅 Calendar & Scheduling
- Project timeline visualization
- Task deadline tracking
- Team availability management
- Meeting and milestone scheduling

### 📈 Reporting & Analytics
- Comprehensive business intelligence
- Custom report generation
- Data export capabilities
- Performance trend analysis

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Accessible component primitives
- **Framer Motion** - Smooth animations
- **React Hook Form** - Form management with validation
- **Zod** - Schema validation
- **Recharts** - Data visualization

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **Prisma ORM** - Database toolkit and query builder
- **PostgreSQL** - Robust relational database
- **Neon Database** - Serverless PostgreSQL platform

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript** - Static type checking
- **Prisma Studio** - Database management GUI

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** and npm/pnpm/yarn
- **PostgreSQL database** (Neon.tech recommended for serverless)
- **Git** for version control

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/zoolyum-crm.git
   cd zoolyum-crm
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Environment setup** (Automated)
   ```bash
   # Quick setup with generated secrets
   npm run env:setup
   ```
   
   Or manually:
   ```bash
   cp .env.template .env.local
   ```
   
   **Required environment variables:**
   ```env
   DATABASE_URL="postgresql://username:password@host/database?sslmode=require"
   NEXTAUTH_SECRET="your-generated-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   NEXT_PUBLIC_API_URL="http://localhost:3000/api"
   ```

4. **Validate environment**
   ```bash
   npm run env:validate
   ```

5. **Database setup**
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Run database migrations
   npx prisma db push
   
   # Test database connection
   npm run test:db
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### 🔧 Additional Setup Commands

```bash
# Complete setup (environment + dependencies)
npm run setup

# Health check (environment + database)
npm run health:check

# Environment validation only
npm run env:check

# Open Prisma Studio
npm run db:studio
```

### 📚 Setup Documentation

- **[Environment Setup Guide](./ENV_SETUP.md)** - Detailed environment configuration
- **[Database Setup](./DATABASE_SETUP.md)** - Database configuration and migrations
- **[Deployment Guide](./DEPLOYMENT.md)** - Production deployment instructions

## 📁 Project Structure

```
zoolyum-crm/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── clients/       # Client management endpoints
│   │   ├── projects/      # Project management endpoints
│   │   ├── tasks/         # Task management endpoints
│   │   ├── team/          # Team management endpoints
│   │   └── invoices/      # Invoice management endpoints
│   ├── dashboard/         # Dashboard pages
│   └── globals.css        # Global styles
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components
│   ├── clients/          # Client-specific components
│   ├── projects/         # Project-specific components
│   ├── tasks/            # Task-specific components
│   ├── team/             # Team-specific components
│   └── invoices/         # Invoice-specific components
├── lib/                   # Utility functions
│   ├── database.ts       # Database connection
│   ├── auth.ts           # Authentication logic
│   └── utils.ts          # Helper functions
├── prisma/               # Database schema and migrations
│   ├── schema.prisma     # Prisma schema
│   └── migrations/       # Database migrations
├── types/                # TypeScript type definitions
└── public/               # Static assets
```

## 🔧 Configuration

### Database Configuration

The application uses PostgreSQL with Prisma ORM. For detailed database setup instructions, see [DATABASE_SETUP.md](./DATABASE_SETUP.md).

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `NEXTAUTH_SECRET` | Authentication secret key | ✅ |
| `NEXTAUTH_URL` | Application URL | ✅ |

## 📚 API Documentation

### Core Endpoints

- **Clients**: `/api/clients` - CRUD operations for client management
- **Projects**: `/api/projects` - Project lifecycle management
- **Tasks**: `/api/tasks` - Task creation and tracking
- **Team**: `/api/team` - Team member management
- **Invoices**: `/api/invoices` - Invoice generation and management

For detailed API documentation, see [TASK_API_README.md](./TASK_API_README.md).

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### API Testing

Test API endpoints using the provided test scripts:

```bash
# Test database connection
node test-db-connection.js

# Test API endpoints
node test-api.js

# Test specific functionality
node test-task-creation.js
node test-team-creation.js
```

## 🚀 Deployment

### Quick Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/zoolyum-crm)

### Manual Deployment

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)

**Quick Steps:**

1. **Set Environment Variables** in Vercel:
   ```bash
   DATABASE_URL=your_neon_postgresql_url
   NEXTAUTH_SECRET=your_secret_key
   NEXTAUTH_URL=https://your-app.vercel.app
   ```

2. **Deploy**: Connect your GitHub repository to Vercel

3. **Database Setup**: Run migrations after deployment:
   ```bash
   npx prisma db push
   ```

### Environment Configuration

Copy `.env.example` to `.env.local` and configure your environment variables:
```bash
cp .env.example .env.local
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Use Prettier for code formatting
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

- 📧 Email: support@zoolyum.com
- 📖 Documentation: [docs.zoolyum.com](https://docs.zoolyum.com)
- 🐛 Issues: [GitHub Issues](https://github.com/your-username/zoolyum-crm/issues)

## 🙏 Acknowledgments

- Built with [v0.dev](https://v0.dev) for rapid prototyping
- UI components from [Radix UI](https://radix-ui.com)
- Database hosting by [Neon](https://neon.tech)
- Deployment platform by [Vercel](https://vercel.com)

---

**Live Demo**: [https://vercel.com/sakibbhais-projects/v0-crm-entity-structure](https://vercel.com/sakibbhais-projects/v0-crm-entity-structure)

**Built with ❤️ using Next.js, TypeScript, and modern web technologies.**