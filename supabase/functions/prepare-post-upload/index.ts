import {
  jsonResponse,
  normalizeKenyanPhone,
  plans,
  preflight,
  rateLimit,
  requiredEnv,
  serviceHeaders,
  supabaseUrl,
  type PaidPostMedia,
  type Plan,
  type Provider,
} from "../_shared/common.ts";
import { hasBlockedSubmissionText } from "../_shared/content_moderation.ts";

const categoryNames = [
  "Football",
  "Digital Culture",
  "Creator Economy",
  "AI & Technology",
  "Media & Marketing",
  "Trending Topics",
  "Politics & Elections",
];
const fileTypes: Record<string, { kind: "image" | "video"; extension: string; maxSize: number; bucket: string }> = {
  "image/jpeg": { kind: "image", extension: "jpg", maxSize: 10 * 1024 * 1024, bucket: "blog-post-private-images" },
  "image/png": { kind: "image", extension: "png", maxSize: 10 * 1024 * 1024, bucket: "blog-post-private-images" },
  "image/webp": { kind: "image", extension: "webp", maxSize: 10 * 1024 * 1024, bucket: "blog-post-private-images" },
  "video/mp4": { kind: "video", extension: "mp4", maxSize: 100 * 1024 * 1024, bucket: "blog-post-private-videos" },
  "video/webm": { kind: "video", extension: "webm", maxSize: 100 * 1024 * 1024, bucket: "blog-post-private-videos" },
};

function isText(value: unknown, minimum: number, maximum: number): value is string {
  return typeof value === "string" && value.trim().length >= minimum && value.trim().length <= maximum;
}

function objectPath(path: string): string {
  return path.split("/").map(encodeURIComponent).join("/");
}

Deno.serve(async (request: Request) => {
  const earlyResponse = preflight(request);
  if (earlyResponse) return earlyResponse;

  let postId: string | undefined;
  try {
    if (!await rateLimit(request)) {
      return jsonResponse({ error: "Too many submissions from this connection. Please try again later." }, 429, request);
    }

    const declaredLength = Number(request.headers.get("content-length") ?? 0);
    if (declaredLength > 32 * 1024) {
      return jsonResponse({ error: "Submission details are too large." }, 413, request);
    }
    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > 32 * 1024) {
      return jsonResponse({ error: "Submission details are too large." }, 413, request);
    }
    const body = JSON.parse(rawBody);
    const authorName = typeof body.author_name === "string" ? body.author_name.trim() : "";
    const authorEmail = typeof body.author_email === "string" ? body.author_email.trim().toLowerCase() : "";
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const excerpt = typeof body.excerpt === "string" ? body.excerpt.trim() : "";
    const content = typeof body.content === "string" ? body.content.trim() : "";
    const category = body.category;
    const plan = body.plan;
    const provider = body.provider;
    const attachments = body.attachments;

    if (
      !isText(authorName, 1, 80) ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(authorEmail) ||
      authorEmail.length > 254 ||
      !isText(title, 8, 120) ||
      !isText(excerpt, 30, 240) ||
      !isText(content, 300, 12000) ||
      typeof category !== "string" ||
      !categoryNames.includes(category) ||
      typeof plan !== "string" ||
      !Object.hasOwn(plans, plan) ||
      typeof provider !== "string" ||
      !["mpesa", "stripe", "paypal"].includes(provider) ||
      !Array.isArray(attachments) ||
      attachments.length > 6
    ) {
      return jsonResponse({ error: "Check the required fields and the number of attachments." }, 400, request);
    }
    if (hasBlockedSubmissionText(authorName, title, excerpt, content)) {
      return jsonResponse({
        error: "Please remove profanity or abusive language from the author name, title, summary, and article.",
      }, 400, request);
    }

    const selectedPlan = plans[plan as Plan];
    const selectedProvider = provider as Provider;
    let imageCount = 0;
    let videoCount = 0;
    let totalBytes = 0;

    const media: PaidPostMedia[] = [];
    for (const attachment of attachments as Record<string, unknown>[]) {
      const mimeType = attachment?.mimeType;
      const size = attachment?.size;
      const type = typeof mimeType === "string" ? fileTypes[mimeType] : undefined;
      if (!type || !Number.isSafeInteger(size) || Number(size) < 1 || Number(size) > type.maxSize) {
        return jsonResponse({ error: "One of the selected files has an unsupported type or exceeds its size limit." }, 400, request);
      }
      if (type.kind === "image") imageCount += 1;
      else videoCount += 1;
      totalBytes += Number(size);

      const path = `${crypto.randomUUID()}/${crypto.randomUUID()}.${type.extension}`;
      media.push({ path, kind: type.kind, mimeType: mimeType as string, size: Number(size) });
    }

    if (imageCount > 5 || videoCount > 1 || totalBytes > 150 * 1024 * 1024) {
      return jsonResponse({ error: "Add up to 5 photos (10 MB each) and 1 video (100 MB maximum)." }, 400, request);
    }

    let phone: string | null = null;
    if (selectedProvider === "mpesa") {
      if (typeof body.phone !== "string") {
        return jsonResponse({ error: "Enter a Kenyan phone number for M-Pesa." }, 400, request);
      }
      phone = normalizeKenyanPhone(body.phone);
    }

    const checkoutToken = crypto.randomUUID() + crypto.randomUUID();
    const checkoutTokenHash = [...new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(checkoutToken)),
    )].map((byte) => byte.toString(16).padStart(2, "0")).join("");

    const insertResponse = await fetch(supabaseUrl("paid_posts"), {
      method: "POST",
      headers: serviceHeaders("return=representation"),
      body: JSON.stringify({
        author_name: authorName,
        author_email: authorEmail,
        title,
        excerpt,
        content,
        category,
        plan,
        amount_usd: selectedPlan.amountUsd,
        payment_currency: selectedProvider === "mpesa" ? "KES" : "USD",
        payment_provider: selectedProvider,
        provider_data: { phone },
        media,
        checkout_token_hash: checkoutTokenHash,
        draft_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      }),
    });
    const insertedRows = await insertResponse.json();
    if (!insertResponse.ok || !insertedRows[0]?.id) {
      console.error("Could not create private post draft:", insertedRows);
      throw new Error("Could not save your post. Please try again.");
    }
    postId = insertedRows[0].id;

    const uploads = [];
    const baseUrl = requiredEnv("SUPABASE_URL").replace(/\/$/, "");
    for (const item of media) {
      const bucket = fileTypes[item.mimeType].bucket;
      const signedResponse = await fetch(
        `${baseUrl}/storage/v1/object/upload/sign/${bucket}/${objectPath(item.path)}`,
        {
          method: "POST",
          headers: serviceHeaders(),
          body: JSON.stringify({ upsert: false }),
        },
      );
      const signed = await signedResponse.json();
      if (!signedResponse.ok || typeof signed.token !== "string") {
        console.error("Could not sign private media upload:", signed);
        throw new Error("Could not safely prepare a photo or video upload.");
      }
      uploads.push({
        bucket,
        path: item.path,
        token: signed.token,
        mimeType: item.mimeType,
        size: item.size,
      });
    }

    return jsonResponse({ postId, checkoutToken, uploads }, 200, request);
  } catch (error) {
    if (postId) {
      const failed = await fetch(
        supabaseUrl(`paid_posts?id=eq.${encodeURIComponent(postId)}&status=eq.pending`),
        {
          method: "PATCH",
          headers: serviceHeaders(),
          body: JSON.stringify({ status: "failed" }),
        },
      );
      if (!failed.ok) console.error("Could not mark the incomplete draft as failed:", await failed.text());
    }
    console.error("Could not prepare paid post submission:", error);
    const message = error instanceof Error ? error.message : "Could not prepare your post.";
    return jsonResponse({ error: message }, 500, request);
  }
});
