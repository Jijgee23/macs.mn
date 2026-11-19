-- AlterTable
ALTER TABLE "Post" ADD COLUMN "galleryIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
