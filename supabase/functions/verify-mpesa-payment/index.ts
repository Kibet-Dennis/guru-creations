import { getPost, jsonResponse, preflight } from "../_shared/common.ts";

Deno.serve(async (request: Request) => {
  const earlyResponse = preflight(request);
  if (earlyResponse) return earlyResponse;

  try {
    const body = await request.json();
    const postId = typeof body.postId === "string" ? body.postId : "";
    if (!/^[0-9a-f-]{36}$/i.test(postId)) {
      return jsonResponse({ error: "The post reference is invalid." }, 400, request);
    }

    const post = await getPost(postId);
    if (!post || post.payment_provider !== "mpesa") {
      return jsonResponse({ error: "The M-Pesa post could not be found." }, 404, request);
    }

    if (post.status === "published" || post.status === "failed") {
      return jsonResponse({ status: post.status }, 200, request);
    }
    return jsonResponse({ status: "pending" }, 200, request);
  } catch (error) {
    console.error("Could not check M-Pesa payment status:", error);
    const message = error instanceof Error ? error.message : "Could not check payment status.";
    return jsonResponse({ error: message }, 500, request);
  }
});
