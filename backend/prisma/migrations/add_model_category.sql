-- AlterTable
ALTER TABLE "models" ADD COLUMN "category" TEXT DEFAULT 'general';

-- CreateIndex
CREATE INDEX "models_category_idx" ON "models"("category");

-- Comment
COMMENT ON COLUMN "models"."category" IS '模型分类: text, image, video, audio, embedding, moderation, general';
