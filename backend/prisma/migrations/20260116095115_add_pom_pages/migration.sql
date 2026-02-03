-- CreateTable
CREATE TABLE "PomPageSet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PomPage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pomSetId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    CONSTRAINT "PomPage_pomSetId_fkey" FOREIGN KEY ("pomSetId") REFERENCES "PomPageSet" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PomElement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pomPageId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "locatorType" TEXT NOT NULL,
    "locatorValue" TEXT NOT NULL,
    "description" TEXT,
    CONSTRAINT "PomElement_pomPageId_fkey" FOREIGN KEY ("pomPageId") REFERENCES "PomPage" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "PomPageSet_createdAt_idx" ON "PomPageSet"("createdAt");

-- CreateIndex
CREATE INDEX "PomPageSet_name_idx" ON "PomPageSet"("name");

-- CreateIndex
CREATE INDEX "PomPage_pomSetId_idx" ON "PomPage"("pomSetId");

-- CreateIndex
CREATE INDEX "PomElement_pomPageId_idx" ON "PomElement"("pomPageId");
