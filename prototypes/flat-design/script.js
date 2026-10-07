const setActiveButton = (buttons, activeButton) => {
  buttons.forEach((button) => {
    const isActive = button === activeButton;
    button.classList.toggle("is-active", isActive);
    if (button.hasAttribute("role")) {
      button.setAttribute("aria-selected", String(isActive));
    }
  });
};

const searchTabs = [...document.querySelectorAll(".route-search__tabs button")];
searchTabs.forEach((button) => {
  button.addEventListener("click", () => setActiveButton(searchTabs, button));
});

const filterButtons = [...document.querySelectorAll(".filters button")];
const journeyCards = [...document.querySelectorAll(".journey-card")];

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setActiveButton(filterButtons, button);
    const category = button.textContent.trim().toLowerCase();

    journeyCards.forEach((card) => {
      const categories = card.dataset.category || "";
      const shouldShow = category === "all routes" || categories.includes(category);
      card.classList.toggle("is-hidden", !shouldShow);
    });
  });
});

document.querySelector(".route-search")?.addEventListener("submit", (event) => {
  event.preventDefault();
  document.querySelector("#journeys")?.scrollIntoView({ behavior: "smooth" });
});
