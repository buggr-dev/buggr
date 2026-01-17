-- AlterTable
ALTER TABLE "Bugger" ADD COLUMN     "grade" TEXT;

-- CreateIndex
CREATE INDEX "Bugger_grade_idx" ON "Bugger"("grade");
