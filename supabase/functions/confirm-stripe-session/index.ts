import {
  getPost,
  jsonResponse,
  plans,
  preflight,
  publishPaidPost,
  requiredEnv,
  type Plan,
} from "../_shared/common.ts";

Deno.serve(async (request: Request) => {
  const earlyResponse = preflight(request);
  if (earlyResponse) return earlyResponse;

  try {
    const body = await request.json();
    const sessionId = typeof body.sessionId === "string" ? body.sessionId : "";
    const postId = typeof body.postId === "string" ? body.postId : "";
    if (!/^cs_(?:test|live)_[A-Za-z0-9]+$/.test(sessionId) || !/^[0-9a-f-]{36}$/i.test(postId)) {
      return jsonResponse({ error: "The Stripe return information is invalid." }, 400, request);
    }

    const post = await getPost(postId);
    if (!post || post.payment_provider !== "stripe" || post.payment_reference !== sessionId) {
      return jsonResponse({ error: "This Stripe session does not match a pending post." }, 400, request);
    }
    if (post.status === "published") return jsonResponse({ status: "published" }, 200, request);
    if (post.status !== "pending") return jsonResponse({ error: "This post is not awaiting payment." }, 409, request);

    const planName = post.plan as Plan;
    const plan = plans[planName];
    if (!plan || Number(post.amount_usd) !== plan.amountUsd) {
      return jsonResponse({ error: "The Stripe amount does not match the selected plan." }, 400, request);
    }

    const stripeResponse = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,
      { headers: { Authorization: `Bearer ${requiredEnv("STRIPE_SECRET_KEY")}` } },
    );
    const session = await stripeResponse.json();
    if (
      !stripeResponse.ok ||
      session.id !== sessionId ||
      session.metadata?.post_id !== postId ||
      session.metadata?.plan !== planName ||
      session.payment_status !== "paid" ||
      session.mode !== "payment" ||
      session.currency !== "usd" ||
      session.amount_total !== plan.amountUsd * 100
    ) {
      return jsonResponse({ status: "pending" }, 200, request);
    }

    await publishPaidPost(postId, sessionId);
    return jsonResponse({ status: "published" }, 200, request);
  } catch (error) {
    console.error("Stripe session verification failed:", error);
    const message = error instanceof Error ? error.message : "Could not verify the Stripe payment.";
    return jsonResponse({ error: message }, 500, request);
  }
});
