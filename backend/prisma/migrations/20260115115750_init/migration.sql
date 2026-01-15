-- CreateTable
CREATE TABLE "Framework" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "projectName" TEXT NOT NULL DEFAULT 'pytest-automation',
    "baseUrl" TEXT NOT NULL,
    "browser" TEXT NOT NULL DEFAULT 'chrome',
    "headless" BOOLEAN NOT NULL DEFAULT true,
    "totalPages" INTEGER NOT NULL DEFAULT 0,
    "totalTests" INTEGER NOT NULL DEFAULT 0,
    "lastUrls" TEXT NOT NULL DEFAULT '[]',
    "defaultTimeout" INTEGER NOT NULL DEFAULT 30000,
    "retries" INTEGER NOT NULL DEFAULT 0,
    "retryDelay" INTEGER NOT NULL DEFAULT 1000,
    "useAllureReport" BOOLEAN NOT NULL DEFAULT true,
    "screenshotOnFailure" BOOLEAN NOT NULL DEFAULT true,
    "videoRecording" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "Page" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "frameworkId" TEXT NOT NULL,
    CONSTRAINT "Page_frameworkId_fkey" FOREIGN KEY ("frameworkId") REFERENCES "Framework" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Element" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "locatorType" TEXT NOT NULL,
    "locatorValue" TEXT NOT NULL,
    "description" TEXT,
    "pageId" TEXT NOT NULL,
    CONSTRAINT "Element_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Test" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "frameworkId" TEXT NOT NULL,
    CONSTRAINT "Test_frameworkId_fkey" FOREIGN KEY ("frameworkId") REFERENCES "Framework" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TestStep" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "action" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "value" TEXT,
    "pageId" TEXT,
    "elementId" TEXT,
    "testId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "TestStep_testId_fkey" FOREIGN KEY ("testId") REFERENCES "Test" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Framework_createdAt_idx" ON "Framework"("createdAt");

-- CreateIndex
CREATE INDEX "Framework_name_idx" ON "Framework"("name");

-- CreateIndex
CREATE INDEX "Page_frameworkId_idx" ON "Page"("frameworkId");

-- CreateIndex
CREATE INDEX "Element_pageId_idx" ON "Element"("pageId");

-- CreateIndex
CREATE INDEX "Test_frameworkId_idx" ON "Test"("frameworkId");

-- CreateIndex
CREATE INDEX "TestStep_testId_idx" ON "TestStep"("testId");
