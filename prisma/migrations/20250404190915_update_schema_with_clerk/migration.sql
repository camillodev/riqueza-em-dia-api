/*
  Warnings:

  - You are about to drop the column `stripe_customer_id` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[stripeId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "User_stripe_customer_id_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "stripe_customer_id",
ADD COLUMN     "stripeId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeId_key" ON "User"("stripeId");
