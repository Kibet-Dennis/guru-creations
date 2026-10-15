import {
  getPost,
  jsonResponse,
  plans,
  publishPaidPost,
  type Plan,
} from "../_shared/common.ts";

function bytesToHex(bytes: Uint8Array): string {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function validStripeSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string,
): Promise<boolean> {
  if (!signatureHeader) return false;
  const parts = signatureHeader.split(",").map((part) => part.split("=", 2));
  const timestamp = parts.find(([key]) => key === "t")?.[1];
  const signatures = parts.filter(([key]) => key === "v1").map(([, value]) => value);
  const timestampSeconds = Number(timestamp);
  if (
    !timestamp ||
    !Number.isFinite(timestampSeconds) ||
    signatures.length === 0 ||
    Math.abs(Date.now() / 1000 - timestampSeconds) > 300
  ) {
    return false;
  }

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${timestamp}.${rawBody}`),
  );
  const expected = bytesToHex(new Uint8Array(digest));
  return signatures.some((signature) =>
    signature.length === expected.length &&
    [...signature].reduce((difference, character, index) =>
      difference | (character.charCodeAt(0) ^ expected.charCodeAt(index)), 0) === 0
  );
}

Deno.serve(async (request: Request) => {
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed." }, 405);
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > 1024 * 1024) {
    return jsonResponse({ error: "Webhook payload is too large." }, 413);
  }
  const rawBody = await request.text();
  if (new TextEncoder().encode(rawBody).byteLength > 1024 * 1024) {
    return jsonResponse({ error: "Webhook payload is too large." }, 413);
  }

  try {
    const secret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!secret || !await validStripeSignature(rawBody, request.headers.get("stripe-signature"), secret)) {
      return jsonResponse({ error: "Invalid Stripe signature." }, 400);
    }

    const event = JSON.parse(rawBody);
    if (event.type !== "checkout.session.completed") {
      return jsonResponse({ received: true });
    }

    const session = event.data?.object;
    const postId = session?.metadata?.post_id;
    const planName = session?.metadata?.plan as Plan | undefined;
    const plan = planName ? plans[planName] : undefined;
    if (
      !postId ||
      !plan ||
      session.payment_status !== "paid" ||
      session.mode !== "payment" ||
      session.currency !== "usd" ||
      session.amount_total !== plan.amountUsd * 100
    ) {
      return jsonResponse({ error: "The completed checkout does not match a publishing plan." }, 400);
    }

    const post = await getPost(postId);
    if (
      !post ||
      post.payment_provider !== "stripe" ||
      post.payment_reference !== session.id ||
      post.plan !== planName ||
      Number(post.amount_usd) !== plan.amountUsd
    ) {
      return jsonResponse({ error: "The checkout does not match a pending post." }, 400);
    }

    await publishPaidPost(postId, session.id);
    return jsonResponse({ received: true });
  } catch (error) {
    console.error("Stripe webhook processing failed:", error);
    const message = error instanceof Error ? error.message : "Webhook processing failed.";
    return jsonResponse({ error: message }, 500);
  }
});
