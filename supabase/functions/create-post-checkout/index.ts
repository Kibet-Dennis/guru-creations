import {
  asRecord,
  darajaAccessToken,
  darajaBaseUrl,
  darajaTimestamp,
  getPost,
  jsonResponse,
  normalizeKenyanPhone,
  plans,
  preflight,
  publishPaidPost,
  requiredEnv,
  serviceHeaders,
  supabaseUrl,
  validateUploadedMedia,
  type Plan,
  type Provider,
} from "../_shared/common.ts";

function constantTimeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

async function createPayPalOrder(postId: string, amountUsd: number): Promise<{ url: string; orderId: string }> {
  const credentials = btoa(
    `${requiredEnv("PAYPAL_CLIENT_ID")}:${requiredEnv("PAYPAL_CLIENT_SECRET")}`,
  );
  const baseUrl = Deno.env.get("PAYPAL_ENVIRONMENT") === "production"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
  const tokenResponse = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const tokenData = await tokenResponse.json();
  if (!tokenResponse.ok || typeof tokenData.access_token !== "string") {
    throw new Error("Could not authenticate with PayPal.");
  }

  const siteUrl = requiredEnv("SITE_URL").replace(/\/$/, "");
  const orderResponse = await fetch(`${baseUrl}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": postId,
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [{
        reference_id: postId,
        custom_id: postId,
        amount: { currency_code: "USD", value: amountUsd.toFixed(2) },
        description: "Paid blog post publishing",
      }],
      application_context: {
        return_url: `${siteUrl}/blog1.html?post_id=${encodeURIComponent(postId)}#contribute`,
        cancel_url: `${siteUrl}/blog1.html#contribute`,
        user_action: "PAY_NOW",
      },
    }),
  });
  const orderData = await orderResponse.json();
  const approvalUrl = orderData.links?.find((link: { rel: string }) => link.rel === "approve")?.href;
  if (!orderResponse.ok || !approvalUrl || !orderData.id) {
    throw new Error("PayPal could not create a checkout order.");
  }
  return { url: approvalUrl, orderId: orderData.id };
}

async function storePaymentReference(postId: string, paymentReference: string): Promise<void> {
  const response = await fetch(
    supabaseUrl(`paid_posts?id=eq.${encodeURIComponent(postId)}&status=eq.pending&checkout_started_at=not.is.null`),
    {
      method: "PATCH",
      headers: serviceHeaders("return=representation"),
      body: JSON.stringify({ payment_reference: paymentReference }),
    },
  );
  if (!response.ok) throw new Error("Could not save the payment reference.");
  const rows = await response.json();
  if (rows.length !== 1) throw new Error("Could not link the payment to its post.");
}

Deno.serve(async (request: Request) => {
  const earlyResponse = preflight(request);
  if (earlyResponse) return earlyResponse;

  try {
    const body = await request.json();
    const postId = typeof body.postId === "string" ? body.postId : "";
    const checkoutToken = typeof body.checkoutToken === "string" ? body.checkoutToken : "";
    if (!/^[0-9a-f-]{36}$/i.test(postId) || !/^[0-9a-f-]{72}$/i.test(checkoutToken)) {
      return jsonResponse({ error: "The draft reference is invalid. Please submit your post again." }, 400, request);
    }

    const post = await getPost(postId);
    if (!post || post.status !== "pending") {
      return jsonResponse({ error: "This post draft is unavailable. Please submit it again." }, 404, request);
    }

    const checkoutTokenHash = [...new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(checkoutToken)),
    )].map((byte) => byte.toString(16).padStart(2, "0")).join("");
    if (
      typeof post.checkout_token_hash !== "string" ||
      !constantTimeEqual(checkoutTokenHash, post.checkout_token_hash)
    ) {
      return jsonResponse({ error: "This draft could not be verified." }, 403, request);
    }

    if (
      new Date(String(post.draft_expires_at)).getTime() <= Date.now() ||
      !plans[post.plan as Plan] ||
      Number(post.amount_usd) !== plans[post.plan as Plan].amountUsd
    ) {
      return jsonResponse({ error: "This draft has expired or its plan is invalid. Please submit it again." }, 410, request);
    }

    const provider = post.payment_provider as Provider;
    if (!["mpesa", "stripe", "paypal"].includes(provider)) {
      return jsonResponse({ error: "This payment method is not available." }, 400, request);
    }
    const media = Array.isArray(post.media) ? post.media : [];
    await validateUploadedMedia(postId, media);

    if (post.checkout_started_at) {
      return jsonResponse({
        error: "Payment was already started for this draft. Check your payment method before trying again.",
      }, 409, request);
    }

    let amountKes: number | null = null;
    let exchangeRate: number | null = null;
    const providerData = asRecord(post.provider_data);
    if (provider === "mpesa") {
      const phone = typeof providerData.phone === "string"
        ? normalizeKenyanPhone(providerData.phone)
        : "";
      const exchangeResponse = await fetch("https://open.er-api.com/v6/latest/USD");
      const exchangeData = await exchangeResponse.json();
      exchangeRate = Number(exchangeData?.rates?.KES);
      if (!exchangeResponse.ok || exchangeData?.result !== "success" || !Number.isFinite(exchangeRate)) {
        throw new Error("The current USD/KES exchange rate is unavailable.");
      }
      amountKes = Math.round(plans[post.plan as Plan].amountUsd * exchangeRate);
      post.provider_data = { ...providerData, phone, exchange_rate: exchangeRate };
    }

    const locked = await fetch(
      supabaseUrl(
        `paid_posts?id=eq.${encodeURIComponent(postId)}&status=eq.pending&checkout_started_at=is.null`,
      ),
      {
        method: "PATCH",
        headers: serviceHeaders("return=representation"),
        body: JSON.stringify({
          checkout_started_at: new Date().toISOString(),
          ...(amountKes === null ? {} : { amount_kes: amountKes, provider_data: post.provider_data }),
        }),
      },
    );
    if (!locked.ok) throw new Error("Could not reserve this payment attempt.");
    const lockedRows = await locked.json();
    if (lockedRows.length !== 1) {
      return jsonResponse({ error: "Payment has already been started for this draft." }, 409, request);
    }

    if (provider === "stripe") {
      const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${requiredEnv("STRIPE_SECRET_KEY")}`,
          "Content-Type": "application/x-www-form-urlencoded",
          "Idempotency-Key": `blog-post-${postId}`,
        },
        body: new URLSearchParams({
          mode: "payment",
          success_url: `${requiredEnv("SITE_URL").replace(/\/$/, "")}/blog1.html?payment=processing&post_id=${encodeURIComponent(postId)}&session_id={CHECKOUT_SESSION_ID}#contribute`,
          cancel_url: `${requiredEnv("SITE_URL").replace(/\/$/, "")}/blog1.html#contribute`,
          "line_items[0][quantity]": "1",
          "line_items[0][price_data][currency]": "usd",
          "line_items[0][price_data][unit_amount]": String(plans[post.plan as Plan].amountUsd * 100),
          "line_items[0][price_data][product_data][name]": `Blog post feature (${post.plan})`,
          "metadata[post_id]": postId,
          "metadata[plan]": String(post.plan),
        }),
      });
      const session = await stripeResponse.json();
      if (!stripeResponse.ok || typeof session.url !== "string" || typeof session.id !== "string") {
        console.error("Stripe could not create a checkout session:", session);
        throw new Error("Stripe could not prepare payment.");
      }
      await storePaymentReference(postId, session.id);
      return jsonResponse({ checkoutUrl: session.url }, 200, request);
    }

    if (provider === "paypal") {
      const order = await createPayPalOrder(postId, plans[post.plan as Plan].amountUsd);
      await storePaymentReference(postId, order.orderId);
      return jsonResponse({ checkoutUrl: order.url }, 200, request);
    }

    const phone = normalizeKenyanPhone(String(providerData.phone ?? ""));
    const accessToken = await darajaAccessToken();
    const shortcode = requiredEnv("MPESA_SHORTCODE");
    const callbackSecret = requiredEnv("MPESA_CALLBACK_SECRET");
    if (callbackSecret.length < 32) {
      throw new Error("The M-Pesa callback secret must be at least 32 characters.");
    }
    const timestamp = darajaTimestamp();
    const password = btoa(`${shortcode}${requiredEnv("MPESA_PASSKEY")}${timestamp}`);
    const callbackUrl = new URL(
      `${requiredEnv("SUPABASE_URL").replace(/\/$/, "")}/functions/v1/mpesa-callback`,
    );
    callbackUrl.searchParams.set("secret", callbackSecret);
    const stkResponse = await fetch(`${darajaBaseUrl()}/mpesa/stkpush/v1/processrequest`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: Deno.env.get("MPESA_TRANSACTION_TYPE") || "CustomerPayBillOnline",
        Amount: amountKes,
        PartyA: phone,
        PartyB: shortcode,
        PhoneNumber: phone,
        CallBackURL: callbackUrl.toString(),
        AccountReference: postId.slice(0, 12),
        TransactionDesc: "Paid blog post",
      }),
    });
    const stkData = await stkResponse.json();
    if (!stkResponse.ok || stkData.ResponseCode !== "0" || !stkData.CheckoutRequestID) {
      console.error("M-Pesa rejected the payment request:", stkData);
      throw new Error(stkData.errorMessage || "M-Pesa could not start the payment request.");
    }

    await storePaymentReference(postId, stkData.CheckoutRequestID);
    return jsonResponse({
      postId,
      amountKes,
      amountUsd: plans[post.plan as Plan].amountUsd,
    }, 200, request);
  } catch (error) {
    console.error("Could not start paid post checkout:", error);
    const message = error instanceof Error ? error.message : "Could not start payment.";
    return jsonResponse({ error: message }, 500, request);
  }
});
