-- CreateEnum
CREATE TYPE "Locale" AS ENUM ('ko', 'en', 'ja');

-- CreateEnum
CREATE TYPE "AppSkin" AS ENUM ('canvas', 'paper', 'pop');

-- CreateEnum
CREATE TYPE "AppMode" AS ENUM ('light', 'dark', 'system');

-- CreateEnum
CREATE TYPE "WishlistCategory" AS ENUM ('birthday', 'occasion', 'someday');

-- CreateEnum
CREATE TYPE "InquiryType" AS ENUM ('question', 'feedback', 'bug_report', 'feature_request');

-- CreateEnum
CREATE TYPE "InquiryStatus" AS ENUM ('pending', 'in_progress', 'answered', 'closed');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "bio" TEXT,
    "locale" "Locale" NOT NULL DEFAULT 'ko',
    "skin" "AppSkin" NOT NULL DEFAULT 'canvas',
    "mode" "AppMode" NOT NULL DEFAULT 'system',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wishlists" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "shareId" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "category" "WishlistCategory",
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "wishlists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wishlist_items" (
    "id" UUID NOT NULL,
    "wishlistId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "productUrl" TEXT NOT NULL,
    "imageUrl" TEXT,
    "siteName" TEXT,
    "price" DECIMAL(14,2),
    "currency" CHAR(3),
    "position" INTEGER NOT NULL DEFAULT 0,
    "isReceived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "wishlist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notices" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "notices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inquiries" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" "InquiryType" NOT NULL,
    "subject" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "response" TEXT,
    "status" "InquiryStatus" NOT NULL DEFAULT 'pending',
    "respondedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "inquiries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "wishlists_shareId_key" ON "wishlists"("shareId");

-- CreateIndex
CREATE INDEX "wishlists_userId_idx" ON "wishlists"("userId");

-- CreateIndex
CREATE INDEX "wishlist_items_wishlistId_position_idx" ON "wishlist_items"("wishlistId", "position");

-- CreateIndex
CREATE INDEX "notices_isPublished_isPinned_createdAt_idx" ON "notices"("isPublished", "isPinned", "createdAt");

-- CreateIndex
CREATE INDEX "inquiries_userId_idx" ON "inquiries"("userId");

-- CreateIndex
CREATE INDEX "inquiries_status_idx" ON "inquiries"("status");

-- AddForeignKey
ALTER TABLE "wishlists" ADD CONSTRAINT "wishlists_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_wishlistId_fkey" FOREIGN KEY ("wishlistId") REFERENCES "wishlists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
