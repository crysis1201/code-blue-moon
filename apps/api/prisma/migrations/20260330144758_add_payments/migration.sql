-- CreateTable
CREATE TABLE "salary_cycles" (
    "id" UUID NOT NULL,
    "monthly_booking_id" UUID NOT NULL,
    "helper_id" UUID NOT NULL,
    "household_id" UUID NOT NULL,
    "cycle_month" DATE NOT NULL,
    "scheduled_days" SMALLINT NOT NULL,
    "days_present" SMALLINT NOT NULL,
    "days_absent" SMALLINT NOT NULL DEFAULT 0,
    "days_late" SMALLINT NOT NULL DEFAULT 0,
    "days_leave" SMALLINT NOT NULL DEFAULT 0,
    "gross_salary" INTEGER NOT NULL,
    "deductions" INTEGER NOT NULL DEFAULT 0,
    "bonuses" INTEGER NOT NULL DEFAULT 0,
    "net_salary" INTEGER NOT NULL,
    "platform_commission" INTEGER NOT NULL,
    "helper_payout" INTEGER NOT NULL,
    "payment_processing_fee" INTEGER NOT NULL,
    "household_total" INTEGER NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'draft',
    "household_payment_id" VARCHAR(100),
    "helper_payout_id" VARCHAR(100),
    "calculated_at" TIMESTAMP(3),
    "payment_collected_at" TIMESTAMP(3),
    "payout_completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "salary_cycles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" UUID NOT NULL,
    "type" VARCHAR(30) NOT NULL,
    "from_user_id" UUID,
    "to_user_id" UUID,
    "amount" INTEGER NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'INR',
    "monthly_booking_id" UUID,
    "daily_booking_id" UUID,
    "booking_type" VARCHAR(10),
    "salary_cycle_id" UUID,
    "cf_order_id" VARCHAR(100),
    "cf_payment_id" VARCHAR(100),
    "cf_transfer_id" VARCHAR(100),
    "payment_method" VARCHAR(20),
    "payment_session_id" VARCHAR(200),
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "failure_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "salary_cycles_cycle_month_status_idx" ON "salary_cycles"("cycle_month", "status");

-- CreateIndex
CREATE INDEX "salary_cycles_helper_id_cycle_month_idx" ON "salary_cycles"("helper_id", "cycle_month");

-- CreateIndex
CREATE UNIQUE INDEX "salary_cycles_monthly_booking_id_cycle_month_key" ON "salary_cycles"("monthly_booking_id", "cycle_month");

-- CreateIndex
CREATE INDEX "transactions_from_user_id_created_at_idx" ON "transactions"("from_user_id", "created_at");

-- CreateIndex
CREATE INDEX "transactions_status_type_idx" ON "transactions"("status", "type");

-- CreateIndex
CREATE INDEX "transactions_cf_order_id_idx" ON "transactions"("cf_order_id");

-- AddForeignKey
ALTER TABLE "salary_cycles" ADD CONSTRAINT "salary_cycles_monthly_booking_id_fkey" FOREIGN KEY ("monthly_booking_id") REFERENCES "monthly_bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salary_cycles" ADD CONSTRAINT "salary_cycles_helper_id_fkey" FOREIGN KEY ("helper_id") REFERENCES "helper_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salary_cycles" ADD CONSTRAINT "salary_cycles_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "household_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_from_user_id_fkey" FOREIGN KEY ("from_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_to_user_id_fkey" FOREIGN KEY ("to_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_salary_cycle_id_fkey" FOREIGN KEY ("salary_cycle_id") REFERENCES "salary_cycles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
