/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `isArchived` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Account` table. All the data in the column will be lost.
  - You are about to alter the column `balance` on the `Account` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(15,2)`.
  - You are about to drop the column `createdAt` on the `Category` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Category` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Category` table. All the data in the column will be lost.
  - You are about to drop the column `cancelAtPeriodEnd` on the `Subscription` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Subscription` table. All the data in the column will be lost.
  - You are about to drop the column `currentPeriodEnd` on the `Subscription` table. All the data in the column will be lost.
  - You are about to drop the column `currentPeriodStart` on the `Subscription` table. All the data in the column will be lost.
  - You are about to drop the column `plan` on the `Subscription` table. All the data in the column will be lost.
  - You are about to drop the column `priceId` on the `Subscription` table. All the data in the column will be lost.
  - You are about to drop the column `stripeSubscriptionId` on the `Subscription` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Subscription` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Subscription` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `SupportTicket` table. All the data in the column will be lost.
  - You are about to drop the column `priority` on the `SupportTicket` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `SupportTicket` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `SupportTicket` table. All the data in the column will be lost.
  - The `status` column on the `SupportTicket` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `accountId` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `categoryId` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Transaction` table. All the data in the column will be lost.
  - You are about to alter the column `amount` on the `Transaction` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(15,2)`.
  - You are about to drop the column `avatarUrl` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `stripeCustomerId` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[stripe_subscription_id]` on the table `Subscription` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stripe_customer_id]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[clerk_id]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updated_at` to the `Account` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `Account` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `Category` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `Category` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `type` on the `Category` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `current_period_end` to the `Subscription` table without a default value. This is not possible if the table is not empty.
  - Added the required column `current_period_start` to the `Subscription` table without a default value. This is not possible if the table is not empty.
  - Added the required column `plan_type` to the `Subscription` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `Subscription` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `Subscription` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `status` on the `Subscription` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `updated_at` to the `SupportTicket` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `SupportTicket` table without a default value. This is not possible if the table is not empty.
  - Added the required column `account_id` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `type` on the `Transaction` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `full_name` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('income', 'expense');

-- CreateEnum
CREATE TYPE "SubscriptionPlanType" AS ENUM ('monthly', 'annual');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('active', 'canceled', 'past_due', 'trialing');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('succeeded', 'pending', 'failed');

-- CreateEnum
CREATE TYPE "SupportTicketStatus" AS ENUM ('open', 'in_progress', 'resolved');

-- CreateEnum
CREATE TYPE "ResponderType" AS ENUM ('user', 'admin');

-- CreateEnum
CREATE TYPE "ThemePreference" AS ENUM ('light', 'dark', 'system');

-- CreateEnum
CREATE TYPE "BudgetPeriod" AS ENUM ('monthly', 'yearly');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'premium', 'standard', 'trial');

-- DropForeignKey
ALTER TABLE "Account" DROP CONSTRAINT "Account_userId_fkey";

-- DropForeignKey
ALTER TABLE "Category" DROP CONSTRAINT "Category_userId_fkey";

-- DropForeignKey
ALTER TABLE "Subscription" DROP CONSTRAINT "Subscription_userId_fkey";

-- DropForeignKey
ALTER TABLE "SupportTicket" DROP CONSTRAINT "SupportTicket_userId_fkey";

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_accountId_fkey";

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_userId_fkey";

-- DropIndex
DROP INDEX "Subscription_stripeSubscriptionId_key";

-- DropIndex
DROP INDEX "User_stripeCustomerId_key";

-- AlterTable
ALTER TABLE "Account" DROP COLUMN "createdAt",
DROP COLUMN "isArchived",
DROP COLUMN "updatedAt",
DROP COLUMN "userId",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "is_archived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "user_id" TEXT NOT NULL,
ALTER COLUMN "balance" DROP DEFAULT,
ALTER COLUMN "balance" SET DATA TYPE DECIMAL(15,2);

-- AlterTable
ALTER TABLE "Category" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
DROP COLUMN "userId",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "is_default" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "user_id" TEXT NOT NULL,
DROP COLUMN "type",
ADD COLUMN     "type" "TransactionType" NOT NULL;

-- AlterTable
ALTER TABLE "Subscription" DROP COLUMN "cancelAtPeriodEnd",
DROP COLUMN "createdAt",
DROP COLUMN "currentPeriodEnd",
DROP COLUMN "currentPeriodStart",
DROP COLUMN "plan",
DROP COLUMN "priceId",
DROP COLUMN "stripeSubscriptionId",
DROP COLUMN "updatedAt",
DROP COLUMN "userId",
ADD COLUMN     "canceled_at" TIMESTAMP(3),
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "current_period_end" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "current_period_start" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "plan_type" "SubscriptionPlanType" NOT NULL,
ADD COLUMN     "stripe_subscription_id" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "user_id" TEXT NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "SubscriptionStatus" NOT NULL;

-- AlterTable
ALTER TABLE "SupportTicket" DROP COLUMN "createdAt",
DROP COLUMN "priority",
DROP COLUMN "updatedAt",
DROP COLUMN "userId",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "resolved_at" TIMESTAMP(3),
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "user_id" TEXT NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "SupportTicketStatus" NOT NULL DEFAULT 'open';

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "accountId",
DROP COLUMN "categoryId",
DROP COLUMN "createdAt",
DROP COLUMN "status",
DROP COLUMN "updatedAt",
DROP COLUMN "userId",
ADD COLUMN     "account_id" TEXT NOT NULL,
ADD COLUMN     "category_id" TEXT,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "user_id" TEXT NOT NULL,
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(15,2),
DROP COLUMN "type",
ADD COLUMN     "type" "TransactionType" NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "avatarUrl",
DROP COLUMN "createdAt",
DROP COLUMN "name",
DROP COLUMN "password",
DROP COLUMN "stripeCustomerId",
ADD COLUMN     "avatar_url" TEXT,
ADD COLUMN     "clerk_id" TEXT,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "full_name" TEXT NOT NULL,
ADD COLUMN     "last_login_at" TIMESTAMP(3),
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'trial',
ADD COLUMN     "stripe_customer_id" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "subscription_id" TEXT NOT NULL,
    "stripe_payment_id" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL,
    "payment_method" TEXT NOT NULL,
    "invoice_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportResponse" (
    "id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "responder_type" "ResponderType" NOT NULL,
    "message" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPreference" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "theme" "ThemePreference" NOT NULL DEFAULT 'system',
    "language" TEXT NOT NULL DEFAULT 'pt-BR',
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "notification_settings" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonthlyFinancialSummary" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "month_year" TEXT NOT NULL,
    "income" DECIMAL(15,2) NOT NULL,
    "expense" DECIMAL(15,2) NOT NULL,
    "balance" DECIMAL(15,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonthlyFinancialSummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetGoal" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "category_id" TEXT,
    "name" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "period" "BudgetPeriod" NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BudgetGoal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserPreference_user_id_key" ON "UserPreference"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyFinancialSummary_user_id_month_year_key" ON "MonthlyFinancialSummary"("user_id", "month_year");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_stripe_subscription_id_key" ON "Subscription"("stripe_subscription_id");

-- CreateIndex
CREATE UNIQUE INDEX "User_stripe_customer_id_key" ON "User"("stripe_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "User_clerk_id_key" ON "User"("clerk_id");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportResponse" ADD CONSTRAINT "SupportResponse_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPreference" ADD CONSTRAINT "UserPreference_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthlyFinancialSummary" ADD CONSTRAINT "MonthlyFinancialSummary_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetGoal" ADD CONSTRAINT "BudgetGoal_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetGoal" ADD CONSTRAINT "BudgetGoal_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
