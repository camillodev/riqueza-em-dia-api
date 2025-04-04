-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('pending', 'completed', 'canceled');

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "status" "TransactionStatus" NOT NULL DEFAULT 'pending';
