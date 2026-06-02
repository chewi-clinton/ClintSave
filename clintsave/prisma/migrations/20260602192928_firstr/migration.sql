-- CreateTable
CREATE TABLE "downloads" (
    "id" SERIAL NOT NULL,
    "tiktok_url" TEXT NOT NULL,
    "video_title" TEXT,
    "creator_name" TEXT,
    "thumbnail_url" TEXT,
    "video_url_no_watermark" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "error_message" TEXT,
    "file_size" BIGINT,
    "duration" INTEGER,
    "session_id" TEXT,
    "webhook_callback" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "downloads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_events" (
    "id" SERIAL NOT NULL,
    "event_type" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "downloads_status_idx" ON "downloads"("status");

-- CreateIndex
CREATE INDEX "downloads_session_id_idx" ON "downloads"("session_id");

-- CreateIndex
CREATE INDEX "downloads_created_at_idx" ON "downloads"("created_at");

-- CreateIndex
CREATE INDEX "analytics_events_event_type_idx" ON "analytics_events"("event_type");

-- CreateIndex
CREATE INDEX "analytics_events_created_at_idx" ON "analytics_events"("created_at");
