-- DropForeignKey
ALTER TABLE "public"."wishlists" DROP CONSTRAINT "wishlists_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."wishlist_items" DROP CONSTRAINT "wishlist_items_wishlistId_fkey";

-- DropForeignKey
ALTER TABLE "public"."inquiries" DROP CONSTRAINT "inquiries_userId_fkey";

-- DropTable
DROP TABLE "public"."users";

-- DropTable
DROP TABLE "public"."wishlists";

-- DropTable
DROP TABLE "public"."wishlist_items";

-- DropTable
DROP TABLE "public"."notices";

-- DropTable
DROP TABLE "public"."inquiries";

-- DropEnum
DROP TYPE "public"."Locale";

-- DropEnum
DROP TYPE "public"."AppSkin";

-- DropEnum
DROP TYPE "public"."AppMode";

-- DropEnum
DROP TYPE "public"."WishlistCategory";

-- DropEnum
DROP TYPE "public"."InquiryType";

-- DropEnum
DROP TYPE "public"."InquiryStatus";
