-- CreateTable
CREATE TABLE "reviews" (
    "id" UUID NOT NULL,
    "monthly_booking_id" UUID,
    "daily_booking_id" UUID,
    "booking_type" VARCHAR(10) NOT NULL,
    "reviewer_id" UUID NOT NULL,
    "reviewee_id" UUID NOT NULL,
    "rating" SMALLINT NOT NULL,
    "punctuality_rating" SMALLINT,
    "quality_rating" SMALLINT,
    "hygiene_rating" SMALLINT,
    "behavior_rating" SMALLINT,
    "comment" TEXT,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "flagged" BOOLEAN NOT NULL DEFAULT false,
    "flagged_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_requests" (
    "id" UUID NOT NULL,
    "helper_id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "leave_dates" DATE[],
    "reason" VARCHAR(50),
    "message" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "approved_by" VARCHAR(20),
    "replacement_needed" BOOLEAN NOT NULL DEFAULT false,
    "replacement_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leave_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "replacement_requests" (
    "id" UUID NOT NULL,
    "original_booking_id" UUID NOT NULL,
    "household_id" UUID NOT NULL,
    "original_helper_id" UUID NOT NULL,
    "reason" VARCHAR(30) NOT NULL,
    "urgency" VARCHAR(20) NOT NULL DEFAULT 'standard',
    "replacement_dates" DATE[],
    "visit_details" JSONB NOT NULL,
    "substitute_helper_id" UUID,
    "status" VARCHAR(20) NOT NULL DEFAULT 'open',
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "matched_at" TIMESTAMP(3),
    "fulfilled_at" TIMESTAMP(3),
    "household_rating" SMALLINT,
    "wants_permanent_switch" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "replacement_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reviews_reviewee_id_created_at_idx" ON "reviews"("reviewee_id", "created_at");

-- CreateIndex
CREATE INDEX "replacement_requests_status_urgency_idx" ON "replacement_requests"("status", "urgency");

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewee_id_fkey" FOREIGN KEY ("reviewee_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_helper_id_fkey" FOREIGN KEY ("helper_id") REFERENCES "helper_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "monthly_bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_replacement_id_fkey" FOREIGN KEY ("replacement_id") REFERENCES "replacement_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "replacement_requests" ADD CONSTRAINT "replacement_requests_original_booking_id_fkey" FOREIGN KEY ("original_booking_id") REFERENCES "monthly_bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "replacement_requests" ADD CONSTRAINT "replacement_requests_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "household_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "replacement_requests" ADD CONSTRAINT "replacement_requests_original_helper_id_fkey" FOREIGN KEY ("original_helper_id") REFERENCES "helper_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "replacement_requests" ADD CONSTRAINT "replacement_requests_substitute_helper_id_fkey" FOREIGN KEY ("substitute_helper_id") REFERENCES "helper_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
