// DOM Elements
const blogPostsContainer = document.getElementById("blog-posts");
const searchInput = document.getElementById("search");
const categoryFilter = document.getElementById("category-filter");
const postModal = new bootstrap.Modal(document.getElementById("postModal"));
const modalTitle = document.getElementById("postModalLabel");
const modalBody = document.getElementById("postModalBody");

let allPosts = [];

// Fetch blog posts from posts.json
async function fetchPosts() {
  try {
    const response = await fetch("posts.json");
    allPosts = await response.json();
    displayPosts(allPosts);
  } catch (error) {
    console.error("Error loading posts:", error);
    blogPostsContainer.innerHTML =
      "<p class='text-danger'>⚠️ Failed to load blog posts.</p>";
  }
}

// Display posts
function displayPosts(posts) {
  blogPostsContainer.innerHTML = "";

  if (posts.length === 0) {
    blogPostsContainer.innerHTML =
      "<p class='text-muted'>No blog posts found.</p>";
    return;
  }

  posts.forEach((post, index) => {
    const card = document.createElement("div");
    card.classList.add("col-md-4");

    card.innerHTML = `
      <div class="card h-100">
        <img src="${post.image}" class="card-img-top" alt="${post.title}">
        <div class="card-body">
          <h5 class="card-title">${post.title}</h5>
          <p class="card-text">${post.excerpt}</p>
          <button class="btn btn-read" onclick="openPost(${index})">Read More</button>
        </div>
      </div>
    `;

    blogPostsContainer.appendChild(card);
  });
}

// Open post in modal
function openPost(index) {
  const post = allPosts[index];
  modalTitle.textContent = post.title;
  modalBody.innerHTML = `
    <img src="${post.image}" class="img-fluid mb-3 rounded" alt="${post.title}">
    <p>${post.content}</p>
  `;
  postModal.show();
}

// Search functionality
searchInput.addEventListener("input", () => {
  const query = searchInput.value.toLowerCase();
  const filtered = allPosts.filter(
    (post) =>
      post.title.toLowerCase().includes(query) ||
      post.excerpt.toLowerCase().includes(query) ||
      post.content.toLowerCase().includes(query)
  );
  displayPosts(filtered);
});

// Filter by category
categoryFilter.addEventListener("change", () => {
  const category = categoryFilter.value;
  if (category === "all") {
    displayPosts(allPosts);
  } else {
    const filtered = allPosts.filter(
      (post) => post.category.toLowerCase() === category.toLowerCase()
    );
    displayPosts(filtered);
  }
});

// Initialize
fetchPosts();
