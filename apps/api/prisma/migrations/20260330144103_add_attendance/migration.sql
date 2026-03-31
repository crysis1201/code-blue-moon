-- CreateTable
CREATE TABLE "attendance_logs" (
    "id" UUID NOT NULL,
    "monthly_booking_id" UUID,
    "daily_booking_id" UUID,
    "booking_type" VARCHAR(10) NOT NULL,
    "helper_id" UUID NOT NULL,
    "household_id" UUID NOT NULL,
    "attendance_date" DATE NOT NULL,
    "visit_number" SMALLINT NOT NULL DEFAULT 1,
    "check_in_time" TIMESTAMP(3),
    "check_in_lat" DECIMAL(10,8),
    "check_in_lng" DECIMAL(11,8),
    "check_in_distance_m" INTEGER,
    "check_in_method" VARCHAR(20),
    "check_out_time" TIMESTAMP(3),
    "check_out_lat" DECIMAL(10,8),
    "check_out_lng" DECIMAL(11,8),
    "check_out_method" VARCHAR(20),
    "status" VARCHAR(20) NOT NULL DEFAULT 'scheduled',
    "late_by_minutes" SMALLINT NOT NULL DEFAULT 0,
    "marked_by" VARCHAR(20),
    "override_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "attendance_logs_attendance_date_status_idx" ON "attendance_logs"("attendance_date", "status");

-- CreateIndex
CREATE INDEX "attendance_logs_helper_id_attendance_date_idx" ON "attendance_logs"("helper_id", "attendance_date");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_logs_monthly_booking_id_attendance_date_visit_nu_key" ON "attendance_logs"("monthly_booking_id", "attendance_date", "visit_number");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_logs_daily_booking_id_attendance_date_visit_numb_key" ON "attendance_logs"("daily_booking_id", "attendance_date", "visit_number");

-- AddForeignKey
ALTER TABLE "attendance_logs" ADD CONSTRAINT "attendance_logs_helper_id_fkey" FOREIGN KEY ("helper_id") REFERENCES "helper_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_logs" ADD CONSTRAINT "attendance_logs_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "household_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_logs" ADD CONSTRAINT "attendance_logs_monthly_booking_id_fkey" FOREIGN KEY ("monthly_booking_id") REFERENCES "monthly_bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_logs" ADD CONSTRAINT "attendance_logs_daily_booking_id_fkey" FOREIGN KEY ("daily_booking_id") REFERENCES "daily_bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
