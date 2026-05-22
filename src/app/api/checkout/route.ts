import { NextRequest, NextResponse } from "next/server";
import { stripe, PRICE_ID } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: PRICE_ID, quantity: 1 }],
    customer_email: email,
    subscription_data: { trial_period_days: 30 },
    success_url: `${appUrl}/dashboard?setup=1`,
    cancel_url: `${appUrl}/signup`,
    metadata: { email },
  });

  return NextResponse.json({ url: session.url });
}
