/*
  Warnings:

  - A unique constraint covering the columns `[venue_name,seatCode]` on the table `Seat` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Seat_seatCode_key";

-- CreateIndex
CREATE UNIQUE INDEX "Seat_venue_name_seatCode_key" ON "Seat"("venue_name", "seatCode");
