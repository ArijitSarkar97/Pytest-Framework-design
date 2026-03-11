-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PomPageSet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "frameworkType" TEXT NOT NULL DEFAULT 'pytest-selenium',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_PomPageSet" ("createdAt", "id", "name", "sourceUrl", "updatedAt") SELECT "createdAt", "id", "name", "sourceUrl", "updatedAt" FROM "PomPageSet";
DROP TABLE "PomPageSet";
ALTER TABLE "new_PomPageSet" RENAME TO "PomPageSet";
CREATE INDEX "PomPageSet_createdAt_idx" ON "PomPageSet"("createdAt");
CREATE INDEX "PomPageSet_name_idx" ON "PomPageSet"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
