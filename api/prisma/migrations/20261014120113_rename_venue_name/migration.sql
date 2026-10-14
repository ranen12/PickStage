/*
  Warnings:

  - You are about to drop the column `venue_name` on the `Seat` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[venueName,seatCode]` on the table `Seat` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Seat_venue_name_seatCode_key";

-- AlterTable
ALTER TABLE "Seat" DROP COLUMN "venue_name",
ADD COLUMN     "venueName" VARCHAR(100) NOT NULL DEFAULT 'Main Hall';

-- CreateIndex
CREATE UNIQUE INDEX "Seat_venueName_seatCode_key" ON "Seat"("venueName", "seatCode");
