-- 1. Create enum
CREATE TYPE "TaskStatus" AS ENUM (
  'PENDING',
  'ACTIVE',
  'DELAYED',
  'COMPLETED'
);

-- 2. DROP existing default (IMPORTANT)
ALTER TABLE "Task"
ALTER COLUMN "status" DROP DEFAULT;

-- 3. Alter column type using explicit cast
ALTER TABLE "Task"
ALTER COLUMN "status" TYPE "TaskStatus"
USING status::"TaskStatus";

-- 4. Set new enum default
ALTER TABLE "Task"
ALTER COLUMN "status" SET DEFAULT 'PENDING';
