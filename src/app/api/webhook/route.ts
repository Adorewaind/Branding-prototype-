import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = getSupabase();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const email = session.customer_email || session.metadata?.email;
    if (email && session.customer && session.subscription) {
      const { data: profile } = await supabase.from("profiles").select("id").eq("email", email).single();
      if (profile) {
        await supabase.from("subscriptions").upsert({
          profile_id: profile.id,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: session.subscription as string,
          stripe_price_id: process.env.STRIPE_PRICE_ID!,
          status: "trialing",
        });
      }
    }
  }

  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    const periodEnd = (sub as unknown as { current_period_end: number }).current_period_end;
    await supabase.from("subscriptions")
      .update({ status: sub.status, current_period_end: new Date(periodEnd * 1000).toISOString() })
      .eq("stripe_subscription_id", sub.id);
  }

  return NextResponse.json({ received: true });
}
