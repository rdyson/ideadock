-- Dedupe any existing duplicate sections per (ideaId, category), keeping the most recent.
DELETE FROM "ResearchSection" a
USING "ResearchSection" b
WHERE a."ideaId" = b."ideaId"
  AND a."category" = b."category"
  AND (
    a."createdAt" < b."createdAt"
    OR (a."createdAt" = b."createdAt" AND a."id" < b."id")
  );

-- CreateIndex
CREATE UNIQUE INDEX "ResearchSection_ideaId_category_key" ON "ResearchSection"("ideaId", "category");
