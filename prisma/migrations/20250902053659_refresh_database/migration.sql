-- CreateEnum
CREATE TYPE "public"."wishlist_category" AS ENUM ('GENERAL', 'BIRTHDAY', 'CHRISTMAS', 'WEDDING', 'BABY', 'ELECTRONICS', 'FASHION', 'BOOKS', 'TRAVEL', 'HOME');

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "avatar" TEXT,
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "locale" TEXT NOT NULL DEFAULT 'kr';

-- AlterTable
ALTER TABLE "public"."wishlist_items" ADD COLUMN     "isCompleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."wishlists" ADD COLUMN     "category" "public"."wishlist_category" NOT NULL DEFAULT 'GENERAL';

-- CreateTable
CREATE TABLE "public"."sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "public"."sessions"("sessionToken");

-- AddForeignKey
ALTER TABLE "public"."sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
