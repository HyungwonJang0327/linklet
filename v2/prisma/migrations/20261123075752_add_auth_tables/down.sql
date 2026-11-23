-- DropForeignKey
ALTER TABLE "public"."sessions" DROP CONSTRAINT "sessions_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."accounts" DROP CONSTRAINT "accounts_userId_fkey";

-- AlterTable
ALTER TABLE "public"."users" DROP COLUMN "banExpires",
DROP COLUMN "banReason",
DROP COLUMN "banned",
DROP COLUMN "role";

-- DropTable
DROP TABLE "public"."sessions";

-- DropTable
DROP TABLE "public"."accounts";

-- DropTable
DROP TABLE "public"."verifications";
