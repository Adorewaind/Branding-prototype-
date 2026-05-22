import { NextRequest, NextResponse } from "next/server";
import { getStripe, getPriceId } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
    const priceId = getPriceId();

    if (!priceId) {
      return NextResponse.json({ error: "Stripe price not configured" }, { status: 500 });
    }

    const stripe = getStripe();

    const customers = await stripe.customers.list({ email, limit: 1 });
    const customer = customers.data[0] ?? await stripe.customers.create({ email });

    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      subscription_data: { trial_period_days: 7 },
      success_url: `${appUrl}/dashboard?setup=1`,
      cancel_url: `${appUrl}/signup`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
