-- CreateEnum
CREATE TYPE "StageCategory" AS ENUM ('MUSICAL', 'PLAY', 'CONCERT', 'CLASSICS', 'EXHIBITION');

-- CreateEnum
CREATE TYPE "ViewingGrade" AS ENUM ('ALL', 'MINORS_7', 'MINORS_12', 'MINORS_15', 'ADULT_ONLY');

-- CreateEnum
CREATE TYPE "SeatStatus" AS ENUM ('AVAILABLE', 'HOLD', 'SOLD', 'BLOCKED');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('CONFIRMED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Stage" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "category" "StageCategory" NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "posterUrl" VARCHAR(1000),
    "price" INTEGER NOT NULL,
    "runningTime" INTEGER NOT NULL,
    "rating" "ViewingGrade" NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Stage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StageSchedule" (
    "id" SERIAL NOT NULL,
    "stageId" INTEGER NOT NULL,
    "startAt" TIMESTAMPTZ(3) NOT NULL,
    "endAt" TIMESTAMPTZ(3) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StageSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Seat" (
    "id" SERIAL NOT NULL,
    "venue_name" VARCHAR(100) NOT NULL DEFAULT 'Main Hall',
    "seatCode" VARCHAR(50) NOT NULL,
    "grade" VARCHAR(50) NOT NULL DEFAULT 'STANDARD',
    "rowName" VARCHAR(10) NOT NULL,
    "seatNumber" INTEGER NOT NULL,

    CONSTRAINT "Seat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleSeat" (
    "id" SERIAL NOT NULL,
    "scheduleId" INTEGER NOT NULL,
    "seatId" INTEGER NOT NULL,
    "seatStatus" "SeatStatus" NOT NULL DEFAULT 'AVAILABLE',
    "holderId" VARCHAR(100),
    "holdExpiresAt" TIMESTAMPTZ(3),
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reservationId" INTEGER,

    CONSTRAINT "ScheduleSeat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reservation" (
    "id" SERIAL NOT NULL,
    "scheduleId" INTEGER NOT NULL,
    "reservationNo" VARCHAR(50) NOT NULL,
    "customerName" VARCHAR(100) NOT NULL,
    "customerPhone" VARCHAR(20) NOT NULL,
    "totalAmount" INTEGER NOT NULL,
    "reservationStatus" "ReservationStatus" NOT NULL DEFAULT 'CONFIRMED',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Seat_seatCode_key" ON "Seat"("seatCode");

-- CreateIndex
CREATE UNIQUE INDEX "ScheduleSeat_scheduleId_seatId_key" ON "ScheduleSeat"("scheduleId", "seatId");

-- CreateIndex
CREATE UNIQUE INDEX "Reservation_reservationNo_key" ON "Reservation"("reservationNo");

-- AddForeignKey
ALTER TABLE "StageSchedule" ADD CONSTRAINT "StageSchedule_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "Stage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleSeat" ADD CONSTRAINT "ScheduleSeat_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "StageSchedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleSeat" ADD CONSTRAINT "ScheduleSeat_seatId_fkey" FOREIGN KEY ("seatId") REFERENCES "Seat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleSeat" ADD CONSTRAINT "ScheduleSeat_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "StageSchedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
