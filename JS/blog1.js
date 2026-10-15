const postsContainer = document.getElementById("blog-posts");
const searchInput = document.getElementById("search");
const categoryFilter = document.getElementById("category-filter");
const resultsCount = document.getElementById("results-count");
const postDialog = document.getElementById("post-dialog");
const dialogImage = document.getElementById("dialog-image");
const dialogCategory = document.getElementById("dialog-category");
const dialogTitle = document.getElementById("dialog-title");
const dialogAuthor = document.getElementById("dialog-author");
const dialogBody = document.getElementById("dialog-body");
const submissionForm = document.getElementById("submission-form");
const submissionStatus = document.getElementById("submission-status");
const submissionButton = document.getElementById("submission-submit");
const publishingConfigNotice = document.getElementById("publishing-config-notice");
const providerInputs = [...document.querySelectorAll('input[name="provider"]')];
const mpesaPhoneField = document.getElementById("mpesa-phone-field");
const mpesaPhoneInput = mpesaPhoneField.querySelector("input");
const contributionDetails = document.getElementById("contribute-details");
const photoInput = document.getElementById("post-photos");
const videoInput = document.getElementById("post-video");
const mediaSelectionStatus = document.getElementById("media-selection-status");
const dialogMedia = document.getElementById("dialog-media");
const submissionTextInputs = [
  submissionForm.elements.author_name,
  submissionForm.elements.title,
  submissionForm.elements.excerpt,
  submissionForm.elements.content
];

let allPosts = [];
let submissionInProgress = false;
const blogConfig = window.BLOG_CONFIG || {};

function hasBackendConfig() {
  return Boolean(blogConfig.supabaseUrl && blogConfig.supabaseAnonKey);
}

function functionUrl(name) {
  return `${blogConfig.supabaseUrl.replace(/\/$/, "")}/functions/v1/${name}`;
}

function backendHeaders() {
  return {
    apikey: blogConfig.supabaseAnonKey || "",
    Authorization: `Bearer ${blogConfig.supabaseAnonKey || ""}`,
    "Content-Type": "application/json"
  };
}

const moderation = window.BLOG_MODERATION || { containsBlockedLanguage: () => false };

function setSubmissionMessage(message, state = "error") {
  submissionStatus.textContent = message;
  submissionStatus.dataset.state = state;
}

function selectedMedia() {
  return [
    ...[...photoInput.files].map((file) => ({ file, kind: "image" })),
    ...[...videoInput.files].map((file) => ({ file, kind: "video" }))
  ];
}

function validateSelectedMedia(media) {
  const photos = media.filter((item) => item.kind === "image");
  const videos = media.filter((item) => item.kind === "video");
  if (photos.length > 5) return "Choose up to 5 photos.";
  if (videos.length > 1) return "Choose no more than 1 video.";

  for (const { file, kind } of media) {
    const maxSize = kind === "image" ? 10 * 1024 * 1024 : 100 * 1024 * 1024;
    const allowedTypes = kind === "image"
      ? ["image/jpeg", "image/png", "image/webp"]
      : ["video/mp4", "video/webm"];
    if (!allowedTypes.includes(file.type)) {
      return `${file.name} is not a supported ${kind} format.`;
    }
    if (file.size < 1 || file.size > maxSize) {
      return `${file.name} exceeds the ${kind === "image" ? "10 MB photo" : "100 MB video"} limit.`;
    }
  }
  return "";
}

function updateMediaSelection() {
  const media = selectedMedia();
  const error = validateSelectedMedia(media);
  const bytes = media.reduce((total, item) => total + item.file.size, 0);
  const sizeMb = (bytes / (1024 * 1024)).toFixed(1);
  mediaSelectionStatus.textContent = error ||
    (media.length
      ? `${media.filter((item) => item.kind === "image").length} photo(s), ${media.filter((item) => item.kind === "video").length} video selected (${sizeMb} MB total).`
      : "Photo and video attachments are optional.");
  mediaSelectionStatus.dataset.state = error ? "error" : "success";
  updateSubmissionAvailability(error);
}

function updateSubmissionAvailability(mediaError = validateSelectedMedia(selectedMedia())) {
  let containsBlockedLanguage = false;
  submissionTextInputs.forEach((input) => {
    const blocked = moderation.containsBlockedLanguage(input.value);
    input.setAttribute("aria-invalid", String(blocked));
    containsBlockedLanguage ||= blocked;
  });
  const configured = hasBackendConfig();
  publishingConfigNotice.hidden = configured;
  submissionButton.disabled = submissionInProgress || Boolean(mediaError) || containsBlockedLanguage || !configured;

  if (containsBlockedLanguage) {
    setSubmissionMessage("Please remove profanity or abusive language from the author name, title, summary, and article.", "moderation");
  } else if (!configured) {
    setSubmissionMessage(
      "Submissions are paused. The site owner must connect Supabase, deploy the database migrations and publishing functions, and configure a payment provider before submissions or payments can be accepted.",
      "setup"
    );
  } else if (submissionStatus.dataset.state === "moderation" || submissionStatus.dataset.state === "setup") {
    setSubmissionMessage("", "");
  }
}

function createElement(tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function safePublishedMedia(media) {
  if (!Array.isArray(media) || !blogConfig.supabaseUrl) return [];
  const storageOrigin = new URL(blogConfig.supabaseUrl).origin;
  return media.filter((item) => {
    if (
      !item ||
      !["image", "video"].includes(item.kind) ||
      !["image/jpeg", "image/png", "image/webp", "video/mp4", "video/webm"].includes(item.mimeType) ||
      typeof item.url !== "string"
    ) return false;
    try {
      const url = new URL(item.url);
      return url.origin === storageOrigin &&
        url.pathname.startsWith("/storage/v1/object/public/blog-post-public/");
    } catch {
      return false;
    }
  });
}

function showArticle(post) {
  dialogImage.src = post.image;
  dialogImage.alt = post.title;
  dialogCategory.textContent = post.category;
  dialogTitle.textContent = post.title;
  dialogAuthor.textContent = post.author ? `By ${post.author}` : "";
  dialogBody.textContent = post.content;
  dialogMedia.replaceChildren();
  safePublishedMedia(post.media).forEach((media) => {
    const element = createElement(media.kind === "video" ? "video" : "img", "dialog-attachment");
    element.src = media.url;
    if (media.kind === "video") {
      element.controls = true;
      element.preload = "metadata";
      element.playsInline = true;
      element.setAttribute("aria-label", `Video attachment for ${post.title}`);
    } else {
      element.alt = `Photo attached to ${post.title}`;
      element.loading = "lazy";
    }
    dialogMedia.append(element);
  });
  postDialog.showModal();
}

function renderPosts() {
  const query = searchInput.value.trim().toLocaleLowerCase();
  const category = categoryFilter.value;
  const visiblePosts = allPosts.filter((post) => {
    const matchesCategory = category === "all" || post.category === category;
    const searchableText = `${post.title} ${post.excerpt} ${post.content}`.toLocaleLowerCase();
    return matchesCategory && searchableText.includes(query);
  });

  postsContainer.replaceChildren();
  resultsCount.textContent = `${visiblePosts.length} ${visiblePosts.length === 1 ? "article" : "articles"}`;

  if (visiblePosts.length === 0) {
    postsContainer.append(createElement("p", "empty-state", "No articles match those filters. Try another search or topic."));
    return;
  }

  visiblePosts.forEach((post) => {
    const card = createElement("article", "article-card");
    const image = createElement("img", "article-image");
    const media = safePublishedMedia(post.media);
    image.src = media.find((item) => item.kind === "image")?.url || post.image;
    image.alt = post.title;
    image.loading = "lazy";
    image.decoding = "async";

    const content = createElement("div", "article-card-content");
    const categoryLabel = createElement("p", "article-category", post.category);
    const title = createElement("h3", "", post.title);
    const excerpt = createElement("p", "article-excerpt", post.excerpt);
    const readMore = createElement("button", "read-more", "Read article →");
    readMore.type = "button";
    readMore.addEventListener("click", () => showArticle(post));

    content.append(categoryLabel, title);
    if (post.author) content.append(createElement("p", "article-author", `By ${post.author}`));
    if (media.some((item) => item.kind === "video")) {
      content.append(createElement("p", "article-media-note", "Includes video"));
    }
    content.append(excerpt, readMore);
    card.append(image, content);
    postsContainer.append(card);
  });
}

function populateCategories() {
  const allTopics = createElement("option", "", "All topics");
  allTopics.value = "all";
  categoryFilter.replaceChildren(allTopics);

  const categories = [...new Set(allPosts.map((post) => post.category).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b));

  categories.forEach((category) => {
    const option = createElement("option", "", category);
    option.value = category;
    categoryFilter.append(option);
  });
}

async function loadPosts() {
  try {
    const response = await fetch("posts.json");
    if (!response.ok) {
      throw new Error(`Could not load articles (HTTP ${response.status}).`);
    }

    const posts = await response.json();
    if (!Array.isArray(posts)) {
      throw new Error("The article list has an unexpected format.");
    }

    allPosts = posts.filter((post) =>
      post &&
      typeof post.title === "string" &&
      typeof post.excerpt === "string" &&
      typeof post.content === "string" &&
      typeof post.category === "string" &&
      typeof post.image === "string"
    );

    if (hasBackendConfig()) {
      const publishedResponse = await fetch(
        `${blogConfig.supabaseUrl.replace(/\/$/, "")}/rest/v1/paid_posts?select=author_name,title,excerpt,content,category,image_url,media_public,published_at&status=eq.published&expires_at=gt.${encodeURIComponent(new Date().toISOString())}&order=published_at.desc`,
        { headers: backendHeaders() }
      );
      if (!publishedResponse.ok) {
        throw new Error(`Could not load contributed articles (HTTP ${publishedResponse.status}).`);
      }

      const publishedPosts = await publishedResponse.json();
      allPosts = [
        ...publishedPosts.map((post) => ({
          title: post.title,
          excerpt: post.excerpt,
          content: post.content,
          category: post.category,
          author: post.author_name,
          image: post.image_url || "Assets/hero-section-one.webp",
          media: post.media_public
        })),
        ...allPosts
      ];
    }

    if (allPosts.length === 0) {
      throw new Error("No valid articles are available.");
    }

    populateCategories();
    renderPosts();
  } catch (error) {
    console.error("Unable to load blog articles:", error);
    postsContainer.replaceChildren(
      createElement("p", "empty-state", "We couldn’t load the articles right now. Please try again later.")
    );
    resultsCount.textContent = "";
  }
}

async function getMpesaQuote(plan) {
  if (!hasBackendConfig()) return;

  const response = await fetch(functionUrl("mpesa-quote"), {
    method: "POST",
    headers: backendHeaders(),
    body: JSON.stringify({ plan })
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || "Could not get the current M-Pesa price.");
  }

  setSubmissionMessage(
    `M-Pesa total: KES ${result.amountKes.toLocaleString()} (USD $${result.amountUsd}; live exchange rate ${result.exchangeRate.toFixed(2)} KES/USD).`,
    "success"
  );
}

async function startSubmission(event) {
  event.preventDefault();
  const textContainsBlockedLanguage = submissionTextInputs.some((input) =>
    moderation.containsBlockedLanguage(input.value)
  );
  if (textContainsBlockedLanguage) {
    updateSubmissionAvailability();
    return;
  }
  if (!hasBackendConfig()) {
    updateSubmissionAvailability();
    return;
  }

  const formData = new FormData(submissionForm);
  const provider = formData.get("provider");
  const media = selectedMedia();
  const mediaError = validateSelectedMedia(media);
  if (mediaError) {
    setSubmissionMessage(mediaError);
    return;
  }
  if (!provider) {
    setSubmissionMessage("Choose a payment method to continue.");
    return;
  }

  submissionInProgress = true;
  updateSubmissionAvailability();
  setSubmissionMessage("Preparing your post and secure payment...");

  try {
    const postData = Object.fromEntries(
      [...formData.entries()].filter(([, value]) => typeof value === "string")
    );
    postData.attachments = media.map(({ file, kind }) => ({
      kind,
      mimeType: file.type,
      size: file.size
    }));

    const prepareResponse = await fetch(functionUrl("prepare-post-upload"), {
      method: "POST",
      headers: backendHeaders(),
      body: JSON.stringify(postData)
    });
    const prepared = await prepareResponse.json();
    if (!prepareResponse.ok) {
      throw new Error(prepared.error || "Could not prepare your post.");
    }

    for (let index = 0; index < prepared.uploads.length; index += 1) {
      const upload = prepared.uploads[index];
      const file = media[index].file;
      setSubmissionMessage(`Securely uploading file ${index + 1} of ${prepared.uploads.length}...`);
      const path = upload.path.split("/").map(encodeURIComponent).join("/");
      const uploadUrl = `${blogConfig.supabaseUrl.replace(/\/$/, "")}/storage/v1/object/upload/sign/${upload.bucket}/${path}?token=${encodeURIComponent(upload.token)}`;
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": upload.mimeType,
          "x-upsert": "false"
        },
        body: file
      });
      if (!uploadResponse.ok) {
        throw new Error(`Could not upload ${file.name}. Please check the file and try again.`);
      }
    }

    setSubmissionMessage("Checking your uploads and preparing secure payment...");
    const response = await fetch(functionUrl("create-post-checkout"), {
      method: "POST",
      headers: backendHeaders(),
      body: JSON.stringify({
        postId: prepared.postId,
        checkoutToken: prepared.checkoutToken
      })
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || "Could not prepare payment.");
    }

    if (provider === "mpesa") {
      setSubmissionMessage(`A KES ${result.amountKes.toLocaleString()} payment request was sent. Check your phone and enter your M-Pesa PIN to approve it.`);
      await waitForMpesaPayment(result.postId);
      return;
    }

    if (!result.checkoutUrl) {
      throw new Error("The payment provider did not return a checkout link.");
    }

    window.location.assign(result.checkoutUrl);
  } catch (error) {
    console.error("Unable to start paid post submission:", error);
    setSubmissionMessage(error.message || "Could not start payment. Please try again.");
  } finally {
    submissionInProgress = false;
    updateMediaSelection();
  }
}

async function waitForMpesaPayment(postId) {
  for (let attempt = 0; attempt < 24; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 5000));
    const response = await fetch(functionUrl("verify-mpesa-payment"), {
      method: "POST",
      headers: backendHeaders(),
      body: JSON.stringify({ postId })
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || "Could not verify the M-Pesa payment.");
    }
    if (result.status === "published") {
      setSubmissionMessage("Payment confirmed. Your post is now published.", "success");
      submissionForm.reset();
      updateMpesaFields();
      updateMediaSelection();
      await loadPosts();
      return;
    }
    if (result.status === "failed") {
      throw new Error("The M-Pesa payment was not completed. You can submit again when ready.");
    }
  }

  setSubmissionMessage("Payment is still being confirmed. Refresh this page in a minute to check for your post, and don’t submit the same article again yet.");
}

function updateMpesaFields() {
  const usesMpesa = providerInputs.some((input) => input.checked && input.value === "mpesa");
  mpesaPhoneField.hidden = !usesMpesa;
  mpesaPhoneInput.required = usesMpesa;
  if (!usesMpesa) {
    setSubmissionMessage("");
    return;
  }

  getMpesaQuote(document.getElementById("submission-plan").value).catch((error) => {
    console.error("Unable to calculate M-Pesa price:", error);
    setSubmissionMessage(error.message || "Could not calculate the M-Pesa price.");
  });
}

async function capturePayPalReturn() {
  const params = new URLSearchParams(window.location.search);
  const orderId = params.get("token");
  const postId = params.get("post_id");
  if (!orderId || !postId || !hasBackendConfig()) return;

  setSubmissionMessage("Confirming your PayPal payment...");
  try {
    const response = await fetch(functionUrl("capture-paypal-order"), {
      method: "POST",
      headers: backendHeaders(),
      body: JSON.stringify({ orderId, postId })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not confirm PayPal payment.");
    if (result.status !== "published") throw new Error("PayPal payment is not complete yet.");

    history.replaceState(null, "", window.location.pathname);
    setSubmissionMessage("Payment confirmed. Your post is now published.", "success");
    await loadPosts();
  } catch (error) {
    console.error("Unable to confirm PayPal payment:", error);
    setSubmissionMessage(error.message || "Could not confirm PayPal payment.");
  }
}

async function confirmStripeReturn() {
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get("session_id");
  const postId = params.get("post_id");
  if (!sessionId || !postId || !hasBackendConfig()) return;

  setSubmissionMessage("Confirming your card payment...");
  try {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const response = await fetch(functionUrl("confirm-stripe-session"), {
        method: "POST",
        headers: backendHeaders(),
        body: JSON.stringify({ sessionId, postId })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not confirm card payment.");
      if (result.status === "published") {
        history.replaceState(null, "", window.location.pathname);
        setSubmissionMessage("Payment confirmed. Your post is now published.", "success");
        await loadPosts();
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
    setSubmissionMessage("Your card payment is still processing. Your post will appear here when Stripe confirms it.");
  } catch (error) {
    console.error("Unable to confirm card payment:", error);
    setSubmissionMessage(error.message || "Could not confirm card payment.");
  }
}

searchInput.addEventListener("input", renderPosts);
categoryFilter.addEventListener("change", renderPosts);
providerInputs.forEach((input) => input.addEventListener("change", updateMpesaFields));
document.getElementById("submission-plan").addEventListener("change", updateMpesaFields);
photoInput.addEventListener("change", updateMediaSelection);
videoInput.addEventListener("change", updateMediaSelection);
submissionTextInputs.forEach((input) => input.addEventListener("input", updateSubmissionAvailability));
submissionForm.addEventListener("submit", startSubmission);

function openContributionFromHash() {
  if (window.location.hash === "#contribute") contributionDetails.open = true;
}

window.addEventListener("hashchange", openContributionFromHash);
openContributionFromHash();
loadPosts();
capturePayPalReturn();
confirmStripeReturn();

updateMediaSelection();
