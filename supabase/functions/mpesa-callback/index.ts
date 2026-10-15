import {
  getPost,
  jsonResponse,
  publishPaidPost,
  serviceHeaders,
  supabaseUrl,
  updatePost,
} from "../_shared/common.ts";

function callbackItem(items: Array<{ Name: string; Value?: string | number }>, name: string) {
  return items.find((item) => item.Name === name)?.Value;
}

function constantTimeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

Deno.serve(async (request: Request) => {
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed." }, 405);

  try {
    const expectedSecret = Deno.env.get("MPESA_CALLBACK_SECRET");
    const receivedSecret = new URL(request.url).searchParams.get("secret");
    if (
      !expectedSecret ||
      expectedSecret.length < 32 ||
      !receivedSecret ||
      !constantTimeEqual(receivedSecret, expectedSecret)
    ) {
      return jsonResponse({ error: "Invalid callback secret." }, 401);
    }

    const declaredLength = Number(request.headers.get("content-length") ?? 0);
    if (declaredLength > 64 * 1024) {
      return jsonResponse({ error: "Callback payload is too large." }, 413);
    }
    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > 64 * 1024) {
      return jsonResponse({ error: "Callback payload is too large." }, 413);
    }
    const body = JSON.parse(rawBody);
    const callback = body?.Body?.stkCallback;
    const checkoutRequestId = callback?.CheckoutRequestID;
    if (typeof checkoutRequestId !== "string" || !checkoutRequestId) {
      return jsonResponse({ error: "Missing M-Pesa checkout reference." }, 400);
    }

    const response = await fetch(
      supabaseUrl(`paid_posts?payment_reference=eq.${encodeURIComponent(checkoutRequestId)}&select=*`),
      { headers: serviceHeaders() },
    );
    if (!response.ok) throw new Error(`Could not find M-Pesa post (${response.status}).`);
    const rows = await response.json();
    const post = rows[0];
    if (!post || post.payment_provider !== "mpesa") {
      return jsonResponse({ error: "No matching M-Pesa payment was found." }, 404);
    }
    if (post.status === "published") return jsonResponse({ ResultCode: 0, ResultDesc: "Already confirmed." });

    if (Number(callback.ResultCode) !== 0) {
      await updatePost(post.id, { status: "failed" });
      return jsonResponse({ ResultCode: 0, ResultDesc: "Payment was not completed." });
    }

    const items = callback.CallbackMetadata?.Item;
    if (!Array.isArray(items)) return jsonResponse({ error: "Missing M-Pesa payment details." }, 400);

    const amount = Number(callbackItem(items, "Amount"));
    const phone = String(callbackItem(items, "PhoneNumber") ?? "");
    const receipt = String(callbackItem(items, "MpesaReceiptNumber") ?? "");
    const expectedPhone = String(post.provider_data?.phone ?? "");
    if (
      !Number.isInteger(amount) ||
      amount !== Number(post.amount_kes) ||
      phone !== expectedPhone ||
      !/^[A-Z0-9]{8,16}$/.test(receipt)
    ) {
      console.error("M-Pesa callback values did not match the pending payment.", {
        postId: post.id,
        amount,
        expectedAmount: post.amount_kes,
        phoneMatches: phone === expectedPhone,
        hasReceipt: Boolean(receipt),
      });
      return jsonResponse({ error: "M-Pesa payment details did not match the pending order." }, 400);
    }

    await publishPaidPost(post.id, checkoutRequestId);
    await updatePost(post.id, {
      provider_data: { ...post.provider_data, receipt },
    });
    return jsonResponse({ ResultCode: 0, ResultDesc: "Payment confirmed and post published." });
  } catch (error) {
    console.error("M-Pesa callback processing failed:", error);
    return jsonResponse({ error: error instanceof Error ? error.message : "Could not process M-Pesa callback." }, 500);
  }
});
