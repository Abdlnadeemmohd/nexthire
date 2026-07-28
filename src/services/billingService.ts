export interface SubscriptionPlan {
  id: string;
  name: string;
  priceMonthly: number;
  priceAnnual: number;
  features: string[];
  maxJobs: number;
  maxCandidateContacts: number;
  aiSourcingIncluded: boolean;
}

export interface CouponCode {
  code: string;
  discountPercentage: number;
  description: string;
}

export interface Invoice {
  id: string;
  date: string;
  planName: string;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: "STRIPE" | "RAZORPAY" | "PAYPAL" | "CREDIT_CARD";
  status: "PAID" | "PENDING" | "FAILED";
  pdfDownloadUrl: string;
  gstNumber?: string;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "growth",
    name: "Recruiter Growth",
    priceMonthly: 199,
    priceAnnual: 1990,
    maxJobs: 10,
    maxCandidateContacts: 250,
    aiSourcingIncluded: true,
    features: [
      "Up to 10 Active Job Postings",
      "250 Candidate Direct Outreach Messages",
      "AI Match Score & Candidate Ranking",
      "Standard ATS Pipeline",
      "Email & Chat Support",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise Scale",
    priceMonthly: 499,
    priceAnnual: 4990,
    maxJobs: 50,
    maxCandidateContacts: 1500,
    aiSourcingIncluded: true,
    features: [
      "Up to 50 Active Job Postings",
      "1,500 Candidate Direct Outreach Messages",
      "Advanced AI Sourcing & Match Benchmarking",
      "Configurable 8-Stage ATS Pipeline",
      "Interview Scheduling Integration (Google, Teams, Zoom, Webex)",
      "Dedicated Account Manager & 24/7 SLA Support",
      "Custom Hiring Analytics & Export",
    ],
  },
];

export const VALID_COUPONS: CouponCode[] = [
  { code: "HIRE2026", discountPercentage: 20, description: "20% off for Early Adopters" },
  { code: "ENTERPRISE50", discountPercentage: 50, description: "50% Special Enterprise Launch Offer" },
];

export const BillingService = {
  /**
   * Validates a promotional coupon code
   */
  validateCoupon(code: string): CouponCode | null {
    if (!code) return null;
    const found = VALID_COUPONS.find((c) => c.code.toUpperCase() === code.trim().toUpperCase());
    return found || null;
  },

  /**
   * Computes invoice total breakdown including GST (18%) and discounts
   */
  calculateBillingTotal(basePrice: number, couponCode?: string) {
    const coupon = couponCode ? this.validateCoupon(couponCode) : null;
    const discountAmount = coupon ? (basePrice * coupon.discountPercentage) / 100 : 0;
    const discountedPrice = basePrice - discountAmount;
    const gstTax = Math.round(discountedPrice * 0.18);
    const finalTotal = Math.round(discountedPrice + gstTax);

    return {
      basePrice,
      discountAmount,
      discountedPrice,
      gstTax,
      finalTotal,
      couponApplied: coupon ? coupon.code : null,
    };
  },

  /**
   * Simulates multi-gateway SaaS payment checkout (Stripe, Razorpay, PayPal)
   */
  async processPayment(
    planId: string,
    gateway: "STRIPE" | "RAZORPAY" | "PAYPAL",
    couponCode?: string,
    gstNumber?: string
  ): Promise<{ success: boolean; invoiceId: string; message: string }> {
    await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate async payment API delay

    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId) || SUBSCRIPTION_PLANS[0];
    const totals = this.calculateBillingTotal(plan.priceMonthly, couponCode);
    const invoiceId = `INV-${Date.now().toString().slice(-6)}`;

    return {
      success: true,
      invoiceId,
      message: `Successfully processed $${totals.finalTotal} via ${gateway}. Subscription updated to ${plan.name}.`,
    };
  },
};
