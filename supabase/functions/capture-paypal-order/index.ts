import {
  getPost,
  jsonResponse,
  plans,
  preflight,
  publishPaidPost,
  requiredEnv,
  type Plan,
} from "../_shared/common.ts";

async function paypalAccessToken(baseUrl: string): Promise<string> {
  const credentials = btoa(
    `${requiredEnv("PAYPAL_CLIENT_ID")}:${requiredEnv("PAYPAL_CLIENT_SECRET")}`,
  );
  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const result = await response.json();
  if (!response.ok || typeof result.access_token !== "string") {
    throw new Error("Could not authenticate with PayPal.");
  }
  return result.access_token;
}

Deno.serve(async (request: Request) => {
  const earlyResponse = preflight(request);
  if (earlyResponse) return earlyResponse;

  try {
    const body = await request.json();
    const orderId = typeof body.orderId === "string" ? body.orderId : "";
    const postId = typeof body.postId === "string" ? body.postId : "";
    if (!/^[A-Z0-9-]{10,64}$/.test(orderId) || !/^[0-9a-f-]{36}$/i.test(postId)) {
      return jsonResponse({ error: "The PayPal return information is invalid." }, 400, request);
    }

    const post = await getPost(postId);
    if (!post || post.payment_provider !== "paypal" || post.payment_reference !== orderId) {
      return jsonResponse({ error: "This PayPal order does not match a pending post." }, 400, request);
    }
    if (post.status === "published") return jsonResponse({ status: "published" }, 200, request);
    if (post.status !== "pending") return jsonResponse({ error: "This post is not awaiting payment." }, 409, request);

    const planName = post.plan as Plan;
    const plan = plans[planName];
    if (!plan || Number(post.amount_usd) !== plan.amountUsd) {
      return jsonResponse({ error: "The PayPal amount does not match the selected plan." }, 400, request);
    }

    const baseUrl = Deno.env.get("PAYPAL_ENVIRONMENT") === "production"
      ? "https://api-m.paypal.com"
      : "https://api-m.sandbox.paypal.com";
    const accessToken = await paypalAccessToken(baseUrl);
    const orderResponse = await fetch(`${baseUrl}/v2/checkout/orders/${encodeURIComponent(orderId)}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const order = await orderResponse.json();
    const unit = order.purchase_units?.[0];
    if (
      !orderResponse.ok ||
      order.id !== orderId ||
      unit?.custom_id !== postId ||
      unit?.amount?.currency_code !== "USD" ||
      unit?.amount?.value !== plan.amountUsd.toFixed(2)
    ) {
      return jsonResponse({ error: "PayPal has not confirmed this order for the expected amount." }, 402, request);
    }

    let completedCapture = unit.payments?.captures?.find(
      (item: { status: string }) => item.status === "COMPLETED",
    );
    if (order.status === "APPROVED") {
      const captureResponse = await fetch(
        `${baseUrl}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: "{}",
        },
      );
      const capture = await captureResponse.json();
      completedCapture = capture.purchase_units?.[0]?.payments?.captures?.find(
        (item: { status: string }) => item.status === "COMPLETED",
      );
      if (!captureResponse.ok || capture.status !== "COMPLETED") {
        console.error("PayPal did not complete the expected capture:", capture);
        return jsonResponse({ error: "PayPal has not completed the payment." }, 402, request);
      }
    } else if (order.status !== "COMPLETED") {
      return jsonResponse({ error: "PayPal has not completed the payment." }, 402, request);
    }

    if (
      completedCapture?.amount?.currency_code !== "USD" ||
      completedCapture?.amount?.value !== plan.amountUsd.toFixed(2)
    ) {
      return jsonResponse({ error: "PayPal capture amount did not match the selected plan." }, 402, request);
    }

    await publishPaidPost(postId, completedCapture.id || orderId);
    return jsonResponse({ status: "published" }, 200, request);
  } catch (error) {
    console.error("PayPal capture verification failed:", error);
    const message = error instanceof Error ? error.message : "Could not verify the PayPal payment.";
    return jsonResponse({ error: message }, 500, request);
  }
});
