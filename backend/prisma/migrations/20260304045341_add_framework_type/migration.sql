-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Framework" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "projectName" TEXT NOT NULL DEFAULT 'pytest-automation',
    "baseUrl" TEXT NOT NULL,
    "browser" TEXT NOT NULL DEFAULT 'chrome',
    "headless" BOOLEAN NOT NULL DEFAULT true,
    "frameworkType" TEXT NOT NULL DEFAULT 'pytest-selenium',
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
INSERT INTO "new_Framework" ("baseUrl", "browser", "createdAt", "defaultTimeout", "headless", "id", "lastUrls", "name", "projectName", "retries", "retryDelay", "screenshotOnFailure", "totalPages", "totalTests", "updatedAt", "useAllureReport", "version", "videoRecording") SELECT "baseUrl", "browser", "createdAt", "defaultTimeout", "headless", "id", "lastUrls", "name", "projectName", "retries", "retryDelay", "screenshotOnFailure", "totalPages", "totalTests", "updatedAt", "useAllureReport", "version", "videoRecording" FROM "Framework";
DROP TABLE "Framework";
ALTER TABLE "new_Framework" RENAME TO "Framework";
CREATE INDEX "Framework_createdAt_idx" ON "Framework"("createdAt");
CREATE INDEX "Framework_name_idx" ON "Framework"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
