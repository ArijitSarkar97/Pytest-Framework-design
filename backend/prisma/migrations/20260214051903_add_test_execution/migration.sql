-- CreateTable
CREATE TABLE "TestExecution" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "frameworkId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startTime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" DATETIME,
    "duration" INTEGER,
    "totalTests" INTEGER NOT NULL DEFAULT 0,
    "passCount" INTEGER NOT NULL DEFAULT 0,
    "failCount" INTEGER NOT NULL DEFAULT 0,
    "skipCount" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "TestExecution_frameworkId_fkey" FOREIGN KEY ("frameworkId") REFERENCES "Framework" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TestResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "executionId" TEXT NOT NULL,
    "testName" TEXT NOT NULL,
    "className" TEXT,
    "status" TEXT NOT NULL,
    "duration" INTEGER,
    "errorMessage" TEXT,
    "stackTrace" TEXT,
    CONSTRAINT "TestResult_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "TestExecution" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "TestExecution_frameworkId_idx" ON "TestExecution"("frameworkId");

-- CreateIndex
CREATE INDEX "TestExecution_startTime_idx" ON "TestExecution"("startTime");

-- CreateIndex
CREATE INDEX "TestResult_executionId_idx" ON "TestResult"("executionId");

-- CreateIndex
CREATE INDEX "TestResult_status_idx" ON "TestResult"("status");
