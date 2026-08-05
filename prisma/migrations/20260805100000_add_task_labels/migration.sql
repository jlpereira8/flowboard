CREATE TYPE "TaskLabelColor" AS ENUM ('ZINC', 'BLUE', 'EMERALD', 'AMBER', 'RED', 'VIOLET');

CREATE TABLE "TaskLabel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" "TaskLabelColor" NOT NULL DEFAULT 'ZINC',
    "workspaceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskLabel_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TaskLabelAssignment" (
    "taskId" TEXT NOT NULL,
    "labelId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskLabelAssignment_pkey" PRIMARY KEY ("taskId", "labelId")
);

CREATE UNIQUE INDEX "TaskLabel_workspaceId_name_key" ON "TaskLabel"("workspaceId", "name");
CREATE INDEX "TaskLabel_workspaceId_idx" ON "TaskLabel"("workspaceId");
CREATE INDEX "TaskLabelAssignment_labelId_idx" ON "TaskLabelAssignment"("labelId");

ALTER TABLE "TaskLabel" ADD CONSTRAINT "TaskLabel_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaskLabelAssignment" ADD CONSTRAINT "TaskLabelAssignment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaskLabelAssignment" ADD CONSTRAINT "TaskLabelAssignment_labelId_fkey" FOREIGN KEY ("labelId") REFERENCES "TaskLabel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
