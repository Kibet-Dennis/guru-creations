import {
  deleteStorageObjects,
  jsonResponse,
  requiredEnv,
  serviceHeaders,
  supabaseUrl,
} from "../_shared/common.ts";

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
  const secret = Deno.env.get("BLOG_CLEANUP_SECRET");
  const authorization = request.headers.get("authorization") ?? "";
  if (!secret || !constantTimeEqual(authorization, `Bearer ${secret}`)) {
    return jsonResponse({ error: "Unauthorized." }, 401);
  }

  try {
    const now = new Date().toISOString();
    const failedBefore = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const filter = `(and(status.eq.pending,draft_expires_at.lt.${now}),and(status.eq.published,expires_at.lt.${now}),and(status.eq.failed,created_at.lt.${failedBefore}))`;
    const query = new URLSearchParams({
      select: "id,status,media,media_public",
      or: filter,
      limit: "100",
    });
    const response = await fetch(supabaseUrl(`paid_posts?${query}`), {
      headers: serviceHeaders(),
    });
    if (!response.ok) throw new Error(`Could not find expired posts (${response.status}).`);
    const posts = await response.json();
    let cleaned = 0;

    for (const post of posts) {
      const privateMedia = Array.isArray(post.media) ? post.media : [];
      const publicMedia = Array.isArray(post.media_public) ? post.media_public : [];
      const privateImages = privateMedia
        .filter((item: { kind?: string }) => item.kind === "image")
        .map((item: { path: string }) => item.path);
      const privateVideos = privateMedia
        .filter((item: { kind?: string }) => item.kind === "video")
        .map((item: { path: string }) => item.path);
      const publicPaths = publicMedia.map((item: { path?: string }) => item.path).filter(Boolean);

      await deleteStorageObjects("blog-post-private-images", privateImages);
      await deleteStorageObjects("blog-post-private-videos", privateVideos);
      await deleteStorageObjects("blog-post-public", publicPaths);

      const deleteResponse = await fetch(
        supabaseUrl(`paid_posts?id=eq.${encodeURIComponent(post.id)}&status=eq.${encodeURIComponent(post.status)}`),
        { method: "DELETE", headers: serviceHeaders() },
      );
      if (!deleteResponse.ok) {
        throw new Error(`Could not remove expired post ${post.id} (${deleteResponse.status}).`);
      }
      cleaned += 1;
    }

    const limitsCutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const limitsResponse = await fetch(
      supabaseUrl(`blog_submission_limits?window_started_at=lt.${encodeURIComponent(limitsCutoff)}`),
      { method: "DELETE", headers: serviceHeaders() },
    );
    if (!limitsResponse.ok) {
      throw new Error(`Could not remove old submission-limit records (${limitsResponse.status}).`);
    }

    return jsonResponse({ cleaned });
  } catch (error) {
    console.error("Blog post cleanup failed:", error);
    return jsonResponse({
      error: error instanceof Error ? error.message : "Could not clean up expired posts.",
    }, 500);
  }
});
