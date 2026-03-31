import type { CookPricingProfile } from '@prisma/client';

interface PriceCalcInput {
  meals: number;
  visitsPerDay: number;
  familySize: number;
  includeWeekends: boolean;
  nonVeg: boolean;
  groceryShopping: boolean;
  days?: string; // 'weekdays', 'everyday', or '0,1,2,3,4'
}

interface FamilySurcharge {
  min_size: number;
  max_size: number | null;
  amount: number;
}

export function calculateMonthlyDays(days?: string): number {
  if (!days || days === 'weekdays') return 22;
  if (days === 'everyday') return 30;
  const selectedDays = days.split(',').map(Number);
  return Math.round((selectedDays.length / 7) * 30);
}

export function calculateCookPrice(input: PriceCalcInput, pricing: CookPricingProfile): number {
  let monthlyRate = pricing.baseMonthlyRate;

  // Extra meals (base includes 1 meal)
  if (input.meals > 1) {
    monthlyRate += (input.meals - 1) * pricing.perExtraMeal;
  }

  // Extra visits (base includes 1 visit)
  if (input.visitsPerDay > 1) {
    monthlyRate += (input.visitsPerDay - 1) * pricing.perExtraVisit;
  }

  // Family size surcharge
  const surcharges = pricing.familySurcharges as unknown as FamilySurcharge[];
  if (Array.isArray(surcharges)) {
    const match = surcharges.find(
      (s) => input.familySize >= s.min_size && (s.max_size === null || input.familySize <= s.max_size),
    );
    if (match) {
      monthlyRate += match.amount;
    }
  }

  // Weekend surcharge
  if (input.includeWeekends) {
    monthlyRate += pricing.weekendSurcharge;
  }

  // Non-veg
  if (input.nonVeg) {
    monthlyRate += pricing.nonVegSurcharge;
  }

  // Grocery shopping
  if (input.groceryShopping) {
    monthlyRate += pricing.groceryShoppingAdd;
  }

  // Days adjustment (base is weekdays ~22 days)
  const baseDays = 22;
  const actualDays = calculateMonthlyDays(input.days);
  monthlyRate = Math.round(monthlyRate * (actualDays / baseDays));

  return monthlyRate;
}
