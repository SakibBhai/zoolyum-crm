-- CreateTable
CREATE TABLE "projects" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "client_id" UUID,
    "status" TEXT DEFAULT 'planning',
    "start_date" DATE,
    "end_date" DATE,
    "budget" DECIMAL(10,2),
    "team_members" JSONB DEFAULT '[]',
    "is_recurring" BOOLEAN NOT NULL DEFAULT false,
    "frequency" TEXT,
    "recurrence_end" DATE,
    "recurrence_pattern" JSONB,
    "version_history_id" UUID,
    "last_modified" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_version_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "project_id" UUID NOT NULL,
    "changed_fields" JSONB NOT NULL,
    "previous_values" JSONB NOT NULL,
    "changed_by" TEXT NOT NULL,
    "timestamp" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_version_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "industry" TEXT,
    "contact_name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "status" TEXT DEFAULT 'active',
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "company" TEXT,
    "position" TEXT,
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'new',
    "assigned_to" TEXT,
    "value" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "tags" JSONB NOT NULL DEFAULT '[]',
    "location" TEXT,
    "industry" TEXT,
    "lead_score" INTEGER NOT NULL DEFAULT 0,
    "last_contact_date" TIMESTAMPTZ,
    "next_follow_up" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "lead_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT,
    "date" TIMESTAMPTZ NOT NULL,
    "duration" INTEGER,
    "outcome" TEXT,
    "next_action" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_project_version_history_project_id" ON "project_version_history"("project_id");

-- CreateIndex
CREATE INDEX "idx_leads_status" ON "leads"("status");

-- CreateIndex
CREATE INDEX "idx_leads_assigned_to" ON "leads"("assigned_to");

-- CreateIndex
CREATE INDEX "idx_leads_source" ON "leads"("source");

-- CreateIndex
CREATE INDEX "idx_leads_created_at" ON "leads"("created_at");

-- CreateIndex
CREATE INDEX "idx_activities_lead_id" ON "activities"("lead_id");

-- CreateIndex
CREATE INDEX "idx_activities_type" ON "activities"("type");

-- CreateIndex
CREATE INDEX "idx_activities_date" ON "activities"("date");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_version_history" ADD CONSTRAINT "project_version_history_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
