const setActiveButton = (buttons, activeButton) => {
  buttons.forEach((button) => {
    const isActive = button === activeButton;
    button.classList.toggle("is-active", isActive);
    if (button.hasAttribute("aria-pressed")) {
      button.setAttribute("aria-pressed", String(isActive));
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

// Phone menu: the nav links open as a panel under the bar
const menuButton = document.querySelector(".site-nav__menu");
const menu = document.querySelector("#primary-menu");

const setMenuOpen = (isOpen) => {
  menuButton.setAttribute("aria-expanded", String(isOpen));
  menuButton.setAttribute("aria-label", isOpen ? "Close menu" : "Menu");
  menu.classList.toggle("is-open", isOpen);
};

menuButton?.addEventListener("click", () => {
  setMenuOpen(menuButton.getAttribute("aria-expanded") !== "true");
});

menu?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => setMenuOpen(false));
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && menu?.classList.contains("is-open")) {
    setMenuOpen(false);
    menuButton.focus();
  }
});

window.matchMedia("(min-width: 768px)").addEventListener("change", (event) => {
  if (event.matches && menu) setMenuOpen(false);
});
