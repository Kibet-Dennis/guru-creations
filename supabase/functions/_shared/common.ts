export const plans = {
  "24h": { amountUsd: 2, days: 1 },
  "3d": { amountUsd: 5, days: 3 },
  "7d": { amountUsd: 10, days: 7 },
  "30d": { amountUsd: 25, days: 30 },
} as const;

export type Plan = keyof typeof plans;
export type Provider = "mpesa" | "stripe" | "paypal";
export type PaidPostMedia = {
  path: string;
  kind: "image" | "video";
  mimeType: string;
  size: number;
};

const imageLimits: Record<string, { bucket: string; size: number; signature: (bytes: Uint8Array) => boolean }> = {
  "image/jpeg": {
    bucket: "blog-post-private-images",
    size: 10 * 1024 * 1024,
    signature: (bytes) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
  },
  "image/png": {
    bucket: "blog-post-private-images",
    size: 10 * 1024 * 1024,
    signature: (bytes) => [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
      .every((value, index) => bytes[index] === value),
  },
  "image/webp": {
    bucket: "blog-post-private-images",
    size: 10 * 1024 * 1024,
    signature: (bytes) => String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
      String.fromCharCode(...bytes.slice(8, 12)) === "WEBP",
  },
  "video/mp4": {
    bucket: "blog-post-private-videos",
    size: 100 * 1024 * 1024,
    signature: (bytes) => String.fromCharCode(...bytes.slice(4, 8)) === "ftyp",
  },
  "video/webm": {
    bucket: "blog-post-private-videos",
    size: 100 * 1024 * 1024,
    signature: (bytes) => [0x1a, 0x45, 0xdf, 0xa3]
      .every((value, index) => bytes[index] === value),
  },
};

export function jsonResponse(
  body: unknown,
  status = 200,
  request?: Request,
): Response {
  const siteUrl = Deno.env.get("SITE_URL");
  const allowedOrigin = siteUrl ? new URL(siteUrl).origin : undefined;
  const origin = request?.headers.get("origin");
  const headers = new Headers({
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  });

  if (allowedOrigin && origin === allowedOrigin) headers.set("Access-Control-Allow-Origin", origin);

  return new Response(status === 204 ? null : JSON.stringify(body), { status, headers });
}

export function preflight(request: Request): Response | null {
  const siteUrl = Deno.env.get("SITE_URL");
  if (!siteUrl) {
    return jsonResponse({ error: "The publishing service is not configured." }, 503, request);
  }
  const allowedOrigin = new URL(siteUrl).origin;
  const origin = request.headers.get("origin");
  if (origin !== allowedOrigin) {
    return jsonResponse({ error: "Origin not allowed." }, 403, request);
  }

  if (request.method === "OPTIONS") return jsonResponse({ ok: true }, 204, request);
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed." }, 405, request);
  return null;
}

export function requiredEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Server configuration is missing ${name}.`);
  return value;
}

export function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

export function serviceHeaders(prefer?: string): HeadersInit {
  const key = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  const headers: Record<string, string> = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
  if (prefer) headers.Prefer = prefer;
  return headers;
}

export function supabaseUrl(path: string): string {
  return `${requiredEnv("SUPABASE_URL").replace(/\/$/, "")}/rest/v1/${path}`;
}

function storageObjectUrl(bucket: string, path: string, route: "info" | "authenticated" | "public"): string {
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  return `${requiredEnv("SUPABASE_URL").replace(/\/$/, "")}/storage/v1/object/${route}/${bucket}/${encodedPath}`;
}

export async function deleteStorageObjects(bucket: string, paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  const response = await fetch(
    `${requiredEnv("SUPABASE_URL").replace(/\/$/, "")}/storage/v1/object/${encodeURIComponent(bucket)}`,
    {
      method: "DELETE",
      headers: serviceHeaders(),
      body: JSON.stringify({ prefixes: paths }),
    },
  );
  if (!response.ok) throw new Error(`Could not delete ${bucket} media (${response.status}).`);
}

export async function validateUploadedMedia(postId: string, media: PaidPostMedia[]): Promise<void> {
  if (media.length > 6 || media.filter((item) => item.kind === "image").length > 5 ||
    media.filter((item) => item.kind === "video").length > 1) {
    throw new Error("A post can include up to 5 photos and 1 video.");
  }

  for (const item of media) {
    const typeConfig = imageLimits[item.mimeType];
    const allowedKind = item.kind === "image"
      ? item.mimeType.startsWith("image/")
      : item.mimeType.startsWith("video/");
    if (
      !typeConfig ||
      !allowedKind ||
      !Number.isSafeInteger(item.size) ||
      item.size < 1 ||
      item.size > typeConfig.size ||
      !item.path.startsWith(`${postId}/`)
    ) {
      throw new Error("An uploaded file does not match the allowed media limits.");
    }

    const bucket = typeConfig.bucket;
    const infoResponse = await fetch(storageObjectUrl(bucket, item.path, "info"), {
      headers: serviceHeaders(),
    });
    if (!infoResponse.ok) throw new Error("Upload each selected photo and video before continuing to payment.");
    const info = await infoResponse.json();
    const actualSize = Number(info.size ?? info.metadata?.size);
    const actualType = info.mimetype ?? info.metadata?.mimetype;
    if (actualSize !== item.size || actualType !== item.mimeType) {
      throw new Error("An uploaded file’s type or size did not match its submission details.");
    }

    const rangeHeaders = new Headers(serviceHeaders());
    rangeHeaders.set("Range", "bytes=0-15");
    const fileResponse = await fetch(storageObjectUrl(bucket, item.path, "authenticated"), {
      headers: rangeHeaders,
    });
    if (fileResponse.status !== 206) {
      throw new Error("Could not safely inspect an uploaded file.");
    }
    const bytes = new Uint8Array(await fileResponse.arrayBuffer());
    if (!typeConfig.signature(bytes)) {
      throw new Error("An uploaded file’s contents do not match its selected file type.");
    }
  }
}

export async function getPost(id: string): Promise<Record<string, unknown> | null> {
  const response = await fetch(supabaseUrl(`paid_posts?id=eq.${encodeURIComponent(id)}&select=*`), {
    headers: serviceHeaders(),
  });
  if (!response.ok) throw new Error(`Could not read post (${response.status}).`);
  const rows = await response.json();
  return rows[0] ?? null;
}

export async function updatePost(
  id: string,
  changes: Record<string, unknown>,
): Promise<Record<string, unknown> | null> {
  const response = await fetch(
    supabaseUrl(`paid_posts?id=eq.${encodeURIComponent(id)}`),
    {
      method: "PATCH",
      headers: serviceHeaders("return=representation"),
      body: JSON.stringify(changes),
    },
  );
  if (!response.ok) throw new Error(`Could not update post (${response.status}).`);
  const rows = await response.json();
  return rows[0] ?? null;
}

export async function publishPaidPost(
  id: string,
  providerReference: string,
): Promise<void> {
  const post = await getPost(id);
  if (!post) throw new Error("The paid post could not be found.");
  if (post.status === "published") return;
  if (post.status !== "pending") throw new Error("This post is not awaiting payment.");
  if (new Date(String(post.draft_expires_at)).getTime() <= Date.now()) {
    throw new Error("This draft expired before payment was confirmed. Please submit it again.");
  }

  const plan = plans[post.plan as Plan];
  if (!plan || Number(post.amount_usd) !== plan.amountUsd) {
    throw new Error("The post price does not match its publishing plan.");
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + plan.days * 24 * 60 * 60 * 1000);
  const media = Array.isArray(post.media) ? post.media as PaidPostMedia[] : [];
  await validateUploadedMedia(id, media);

  const publishedMedia: Array<{
    path: string;
    kind: "image" | "video";
    mimeType: string;
    url: string;
  }> = [];
  for (const item of media) {
    const bucket = imageLimits[item.mimeType].bucket;
    const publicUrl = storageObjectUrl("blog-post-public", item.path, "public");
    const existing = await fetch(storageObjectUrl("blog-post-public", item.path, "info"), {
      headers: serviceHeaders(),
    });

    if (existing.status === 404) {
      const copyResponse = await fetch(
        `${requiredEnv("SUPABASE_URL").replace(/\/$/, "")}/storage/v1/object/copy`,
        {
          method: "POST",
          headers: serviceHeaders(),
          body: JSON.stringify({
            bucketId: bucket,
            sourceKey: item.path,
            destinationBucket: "blog-post-public",
            destinationKey: item.path,
          }),
        },
      );
      if (!copyResponse.ok) throw new Error("Could not publish an uploaded photo or video.");
    } else if (!existing.ok) {
      throw new Error(`Could not check published media (${existing.status}).`);
    }

    publishedMedia.push({
      path: item.path,
      kind: item.kind,
      mimeType: item.mimeType,
      url: publicUrl,
    });
  }

  const response = await fetch(
    supabaseUrl(`paid_posts?id=eq.${encodeURIComponent(id)}&status=eq.pending`),
    {
      method: "PATCH",
      headers: serviceHeaders("return=representation"),
      body: JSON.stringify({
        status: "published",
        payment_reference: providerReference,
        paid_at: now.toISOString(),
        published_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        media_public: publishedMedia,
        image_url: publishedMedia.find((item) => item.kind === "image")?.url ?? null,
      }),
    },
  );
  if (!response.ok) throw new Error(`Could not publish paid post (${response.status}).`);
  const updatedRows = await response.json();
  const updated = updatedRows[0] ?? null;
  if (!updated) {
    const latest = await getPost(id);
    if (latest?.status !== "published") throw new Error("The post could not be published.");
  }
  for (const bucket of ["blog-post-private-images", "blog-post-private-videos"]) {
    const paths = media
      .filter((item) => imageLimits[item.mimeType].bucket === bucket)
      .map((item) => item.path);
    try {
      await deleteStorageObjects(bucket, paths);
    } catch (error) {
      console.error(`Published media remains in private bucket ${bucket}:`, error);
    }
  }
}

export async function rateLimit(request: Request): Promise<boolean> {
  const clientAddress = request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip");
  if (!clientAddress) throw new Error("Could not verify the submission source.");

  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(clientAddress),
  );
  const clientHash = [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  const response = await fetch(
    `${requiredEnv("SUPABASE_URL").replace(/\/$/, "")}/rest/v1/rpc/allow_blog_submission`,
    {
      method: "POST",
      headers: serviceHeaders(),
      body: JSON.stringify({ client_hash: clientHash }),
    },
  );
  if (!response.ok) throw new Error(`Could not check submission limit (${response.status}).`);
  return response.json();
}

export async function darajaAccessToken(): Promise<string> {
  const key = requiredEnv("MPESA_CONSUMER_KEY");
  const secret = requiredEnv("MPESA_CONSUMER_SECRET");
  const environment = Deno.env.get("MPESA_ENVIRONMENT") === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";
  const credentials = btoa(`${key}:${secret}`);
  const response = await fetch(`${environment}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${credentials}` },
  });
  const result = await response.json();
  if (!response.ok || typeof result.access_token !== "string") {
    throw new Error("Could not authenticate with M-Pesa.");
  }
  return result.access_token;
}

export function darajaBaseUrl(): string {
  return Deno.env.get("MPESA_ENVIRONMENT") === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";
}

export function darajaTimestamp(date = new Date()): string {
  return date.toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
}

export function normalizeKenyanPhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (/^07\d{8}$/.test(digits)) return `254${digits.slice(1)}`;
  if (/^2547\d{8}$/.test(digits)) return digits;
  if (/^7\d{8}$/.test(digits)) return `254${digits}`;
  throw new Error("Enter a valid Kenyan mobile number.");
}
