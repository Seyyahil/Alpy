(() => {
  const root = document.documentElement;
  const menuToggle = document.querySelector(".menu-toggle");
  const primaryNav = document.querySelector("#primary-nav");
  const bookingForm = document.querySelector("#booking-form");
  const arrivalInput = document.querySelector("#arrival");
  const departureInput = document.querySelector("#departure");
  const bookingStatus = document.querySelector("#booking-status");
  const year = document.querySelector("#current-year");

  const rootStyles = getComputedStyle(root);
  const compactThreshold =
    Number.parseFloat(rootStyles.getPropertyValue("--alpy-ui-size-750")) +
    Number.parseFloat(rootStyles.getPropertyValue("--alpy-ui-size-96"));
  const midWidthThreshold =
    Number.parseFloat(rootStyles.getPropertyValue("--alpy-ui-size-1020")) +
    Number.parseFloat(rootStyles.getPropertyValue("--alpy-ui-size-200")) +
    Number.parseFloat(rootStyles.getPropertyValue("--alpy-ui-size-80"));

  const closeMenu = ({ restoreFocus = false } = {}) => {
    root.dataset.menuOpen = "false";
    menuToggle?.setAttribute("aria-expanded", "false");
    if (restoreFocus) menuToggle?.focus();
  };

  const syncLayout = () => {
    if (!Number.isFinite(compactThreshold)) return;
    const isCompact = window.innerWidth <= compactThreshold;
    root.dataset.compact = String(isCompact);
    root.dataset.midWidth = String(window.innerWidth <= midWidthThreshold);
    if (!isCompact) closeMenu();
  };

  const toDateValue = (date) => {
    const yearPart = date.getFullYear();
    const monthPart = String(date.getMonth() + 1).padStart(2, "0");
    const dayPart = String(date.getDate()).padStart(2, "0");
    return `${yearPart}-${monthPart}-${dayPart}`;
  };

  const addDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (arrivalInput && departureInput) {
    arrivalInput.min = toDateValue(today);
    arrivalInput.value = toDateValue(addDays(today, 14));
    departureInput.min = toDateValue(addDays(today, 1));
    departureInput.value = toDateValue(addDays(today, 17));

    arrivalInput.addEventListener("change", () => {
      if (!arrivalInput.value) return;
      const nextDay = addDays(new Date(`${arrivalInput.value}T00:00:00`), 1);
      departureInput.min = toDateValue(nextDay);
      if (!departureInput.value || departureInput.value < departureInput.min) {
        departureInput.value = toDateValue(nextDay);
      }
    });
  }

  menuToggle?.addEventListener("click", () => {
    const isOpen = root.dataset.menuOpen === "true";
    root.dataset.menuOpen = String(!isOpen);
    menuToggle.setAttribute("aria-expanded", String(!isOpen));
  });

  primaryNav?.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) closeMenu();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && root.dataset.menuOpen === "true") {
      closeMenu({ restoreFocus: true });
    }
  });

  bookingForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!bookingForm.reportValidity()) return;
    bookingStatus.textContent =
      "This concept booking form is ready for a live inventory connection. No reservation has been submitted.";
  });

  if (year) year.textContent = String(new Date().getFullYear());

  syncLayout();
  window.addEventListener("resize", syncLayout, { passive: true });
})();
