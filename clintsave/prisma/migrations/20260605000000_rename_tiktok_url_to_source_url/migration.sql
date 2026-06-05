-- Rename tiktok_url column to source_url to support multiple platforms
ALTER TABLE "downloads" RENAME COLUMN "tiktok_url" TO "source_url";
