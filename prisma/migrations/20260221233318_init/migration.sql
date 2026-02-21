-- CreateTable
CREATE TABLE "cities" (
    "id" TEXT NOT NULL,
    "project_slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "params" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cities_project_slug_idx" ON "cities"("project_slug");
