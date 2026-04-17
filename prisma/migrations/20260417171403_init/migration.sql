-- CreateEnum
CREATE TYPE "IdeaStatus" AS ENUM ('PENDING', 'RESEARCHING', 'READY', 'ERROR');

-- CreateEnum
CREATE TYPE "ResearchCategory" AS ENUM ('MARKET_SIZE', 'COMPETITORS', 'TRENDS', 'CUSTOMER_SEGMENTS', 'RISKS');

-- CreateTable
CREATE TABLE "Idea" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "rawText" TEXT NOT NULL,
    "status" "IdeaStatus" NOT NULL DEFAULT 'PENDING',
    "readinessScore" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Idea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchSection" (
    "id" TEXT NOT NULL,
    "ideaId" TEXT NOT NULL,
    "category" "ResearchCategory" NOT NULL,
    "summary" TEXT NOT NULL,
    "sources" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResearchSection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ResearchSection_ideaId_idx" ON "ResearchSection"("ideaId");

-- AddForeignKey
ALTER TABLE "ResearchSection" ADD CONSTRAINT "ResearchSection_ideaId_fkey" FOREIGN KEY ("ideaId") REFERENCES "Idea"("id") ON DELETE CASCADE ON UPDATE CASCADE;
