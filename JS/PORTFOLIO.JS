const filterButtons = [...document.querySelectorAll(".filter-button")];
const projectCards = [...document.querySelectorAll(".project-card")];
const projectSearch = document.getElementById("project-search");
const projectCount = document.getElementById("project-count");
const emptyState = document.getElementById("empty-state");

let activeFilter = "all";

function updateProjects() {
  const query = projectSearch.value.trim().toLocaleLowerCase();
  let visibleCount = 0;

  projectCards.forEach((card) => {
    const matchesFilter = activeFilter === "all" || card.dataset.category === activeFilter;
    const matchesSearch = card.textContent.toLocaleLowerCase().includes(query);
    const isVisible = matchesFilter && matchesSearch;
    card.hidden = !isVisible;
    if (isVisible) visibleCount += 1;
  });

  projectCount.textContent = `${visibleCount} ${visibleCount === 1 ? "project" : "projects"}`;
  emptyState.hidden = visibleCount !== 0;
}

function selectFilter(filter) {
  activeFilter = filter;
  filterButtons.forEach((button) => {
    const isActive = button.dataset.filter === filter;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
  updateProjects();
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => selectFilter(button.dataset.filter));
});

projectSearch.addEventListener("input", updateProjects);

const requestedFilter = window.location.hash.slice(1);
if (filterButtons.some((button) => button.dataset.filter === requestedFilter)) {
  selectFilter(requestedFilter);
} else {
  updateProjects();
}
