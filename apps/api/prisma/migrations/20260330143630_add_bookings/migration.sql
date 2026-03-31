-- CreateTable
CREATE TABLE "monthly_bookings" (
    "id" UUID NOT NULL,
    "household_id" UUID NOT NULL,
    "helper_id" UUID NOT NULL,
    "schedule_type" VARCHAR(20) NOT NULL,
    "selected_days" SMALLINT[],
    "visits" JSONB NOT NULL,
    "meals_per_day" SMALLINT NOT NULL,
    "visits_per_day" SMALLINT NOT NULL,
    "family_size" SMALLINT NOT NULL,
    "cuisine_tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "extras" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "special_instructions" TEXT,
    "cook_listed_price" INTEGER NOT NULL,
    "agreed_monthly_rate" INTEGER NOT NULL,
    "platform_commission_pct" SMALLINT NOT NULL DEFAULT 10,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "trial_start_date" DATE,
    "trial_end_date" DATE,
    "start_date" DATE,
    "end_date" DATE,
    "pause_reason" TEXT,
    "end_reason" VARCHAR(50),
    "next_review_date" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "monthly_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_bookings" (
    "id" UUID NOT NULL,
    "household_id" UUID NOT NULL,
    "helper_id" UUID NOT NULL,
    "booking_date" DATE NOT NULL,
    "visits" JSONB NOT NULL,
    "per_visit_rate" INTEGER NOT NULL,
    "total_visits" SMALLINT NOT NULL,
    "total_amount" INTEGER NOT NULL,
    "platform_commission_pct" SMALLINT NOT NULL DEFAULT 15,
    "platform_commission_amt" INTEGER NOT NULL,
    "helper_payout" INTEGER NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "cancellation_by" VARCHAR(20),
    "cancellation_reason" TEXT,
    "cancellation_fee" INTEGER NOT NULL DEFAULT 0,
    "payment_status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "payment_id" VARCHAR(100),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "negotiations" (
    "id" UUID NOT NULL,
    "monthly_booking_id" UUID NOT NULL,
    "round" SMALLINT NOT NULL DEFAULT 1,
    "initiated_by" VARCHAR(20) NOT NULL,
    "proposed_rate" INTEGER NOT NULL,
    "message" TEXT,
    "platform_suggested" JSONB,
    "within_range" BOOLEAN,
    "response" VARCHAR(20),
    "counter_rate" INTEGER,
    "counter_message" TEXT,
    "responded_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "negotiations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "monthly_bookings_household_id_status_idx" ON "monthly_bookings"("household_id", "status");

-- CreateIndex
CREATE INDEX "monthly_bookings_helper_id_status_idx" ON "monthly_bookings"("helper_id", "status");

-- CreateIndex
CREATE INDEX "monthly_bookings_status_idx" ON "monthly_bookings"("status");

-- CreateIndex
CREATE INDEX "daily_bookings_booking_date_status_idx" ON "daily_bookings"("booking_date", "status");

-- CreateIndex
CREATE INDEX "daily_bookings_helper_id_booking_date_idx" ON "daily_bookings"("helper_id", "booking_date");

-- CreateIndex
CREATE INDEX "daily_bookings_household_id_booking_date_idx" ON "daily_bookings"("household_id", "booking_date");

-- CreateIndex
CREATE INDEX "negotiations_monthly_booking_id_idx" ON "negotiations"("monthly_booking_id");

-- AddForeignKey
ALTER TABLE "monthly_bookings" ADD CONSTRAINT "monthly_bookings_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "household_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_bookings" ADD CONSTRAINT "monthly_bookings_helper_id_fkey" FOREIGN KEY ("helper_id") REFERENCES "helper_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_bookings" ADD CONSTRAINT "daily_bookings_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "household_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_bookings" ADD CONSTRAINT "daily_bookings_helper_id_fkey" FOREIGN KEY ("helper_id") REFERENCES "helper_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "negotiations" ADD CONSTRAINT "negotiations_monthly_booking_id_fkey" FOREIGN KEY ("monthly_booking_id") REFERENCES "monthly_bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
