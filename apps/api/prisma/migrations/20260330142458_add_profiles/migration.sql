-- CreateTable
CREATE TABLE "household_profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "address_line" TEXT NOT NULL,
    "locality" VARCHAR(100) NOT NULL,
    "city" VARCHAR(50) NOT NULL,
    "pincode" VARCHAR(10) NOT NULL,
    "latitude" DECIMAL(10,8) NOT NULL,
    "longitude" DECIMAL(11,8) NOT NULL,
    "family_size" SMALLINT NOT NULL DEFAULT 2,
    "house_type" VARCHAR(10),
    "dietary_pref" VARCHAR(20) NOT NULL DEFAULT 'veg',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "household_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "helper_profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "service_types" TEXT[],
    "locality" VARCHAR(100) NOT NULL,
    "city" VARCHAR(50) NOT NULL,
    "latitude" DECIMAL(10,8) NOT NULL,
    "longitude" DECIMAL(11,8) NOT NULL,
    "service_radius_km" SMALLINT NOT NULL DEFAULT 5,
    "experience_years" SMALLINT NOT NULL DEFAULT 0,
    "languages" TEXT[] DEFAULT ARRAY['hindi']::TEXT[],
    "bio" TEXT,
    "aadhaar_verified" BOOLEAN NOT NULL DEFAULT false,
    "aadhaar_number_hash" VARCHAR(64),
    "police_verified" BOOLEAN NOT NULL DEFAULT false,
    "verification_status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "available_for_daily" BOOLEAN NOT NULL DEFAULT true,
    "available_for_monthly" BOOLEAN NOT NULL DEFAULT true,
    "available_for_substitute" BOOLEAN NOT NULL DEFAULT false,
    "reputation_score" SMALLINT NOT NULL DEFAULT 0,
    "total_ratings" INTEGER NOT NULL DEFAULT 0,
    "avg_rating" DECIMAL(2,1) NOT NULL DEFAULT 0.0,
    "tier" VARCHAR(20) NOT NULL DEFAULT 'new',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "helper_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cook_pricing_profiles" (
    "id" UUID NOT NULL,
    "helper_id" UUID NOT NULL,
    "base_monthly_rate" INTEGER NOT NULL,
    "per_extra_meal" INTEGER NOT NULL DEFAULT 0,
    "per_extra_visit" INTEGER NOT NULL DEFAULT 0,
    "weekend_surcharge" INTEGER NOT NULL DEFAULT 0,
    "non_veg_surcharge" INTEGER NOT NULL DEFAULT 0,
    "grocery_shopping_add" INTEGER NOT NULL DEFAULT 0,
    "family_surcharges" JSONB NOT NULL DEFAULT '[{"min_size":3,"max_size":4,"amount":1500},{"min_size":5,"max_size":6,"amount":3000},{"min_size":7,"max_size":null,"amount":5000}]',
    "custom_surcharges" JSONB NOT NULL DEFAULT '[]',
    "min_acceptable_rate" INTEGER,
    "per_visit_rate" INTEGER,
    "per_visit_max_meals" SMALLINT NOT NULL DEFAULT 2,
    "per_visit_max_people" SMALLINT NOT NULL DEFAULT 4,
    "cuisine_tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "specialty_dishes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cook_pricing_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "helper_availability" (
    "id" UUID NOT NULL,
    "helper_id" UUID NOT NULL,
    "day_of_week" SMALLINT NOT NULL,
    "slot_start" VARCHAR(5) NOT NULL,
    "slot_end" VARCHAR(5) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'available',
    "booking_id" UUID,

    CONSTRAINT "helper_availability_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "household_profiles_user_id_key" ON "household_profiles"("user_id");

-- CreateIndex
CREATE INDEX "household_profiles_locality_city_idx" ON "household_profiles"("locality", "city");

-- CreateIndex
CREATE UNIQUE INDEX "helper_profiles_user_id_key" ON "helper_profiles"("user_id");

-- CreateIndex
CREATE INDEX "helper_profiles_city_locality_idx" ON "helper_profiles"("city", "locality");

-- CreateIndex
CREATE INDEX "helper_profiles_available_for_daily_available_for_monthly_idx" ON "helper_profiles"("available_for_daily", "available_for_monthly");

-- CreateIndex
CREATE UNIQUE INDEX "cook_pricing_profiles_helper_id_key" ON "cook_pricing_profiles"("helper_id");

-- CreateIndex
CREATE INDEX "helper_availability_helper_id_day_of_week_status_idx" ON "helper_availability"("helper_id", "day_of_week", "status");

-- CreateIndex
CREATE UNIQUE INDEX "helper_availability_helper_id_day_of_week_slot_start_key" ON "helper_availability"("helper_id", "day_of_week", "slot_start");

-- AddForeignKey
ALTER TABLE "household_profiles" ADD CONSTRAINT "household_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "helper_profiles" ADD CONSTRAINT "helper_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cook_pricing_profiles" ADD CONSTRAINT "cook_pricing_profiles_helper_id_fkey" FOREIGN KEY ("helper_id") REFERENCES "helper_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "helper_availability" ADD CONSTRAINT "helper_availability_helper_id_fkey" FOREIGN KEY ("helper_id") REFERENCES "helper_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
