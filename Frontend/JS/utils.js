/**
 * Given an ISO date string (or Date object), returns a formatted date.
 * @param {string|Date} dateInput
 * @param {boolean} includeTime
 * @returns {string} e.g. "2025-06-15 14:30" if includeTime=true, or "2025-06-15" otherwise
 */
export function formatDate(dateInput, includeTime = false) {
  const d = new Date(dateInput);
  if (isNaN(d)) return "";

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  if (!includeTime) {
    return `${yyyy}-${mm}-${dd}`;
  }

  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

/**
 * Format time remaining until expiry.
 * If expiryDate < now, returns "Expired", otherwise returns e.g. "2 days 3 hrs"
 * @param {string|Date} expiryDate
 * @returns {string}
 */
export function formatTimeUntilExpiry(expiryDate) {
  const now = new Date();
  const exp = new Date(expiryDate);
  if (isNaN(exp)) return "";

  const diffMs = exp - now;
  if (diffMs <= 0) return "Expired";

  const diffSec = Math.floor(diffMs / 1000);
  const days = Math.floor(diffSec / 86400);
  const hours = Math.floor((diffSec % 86400) / 3600);
  // You can add minutes if needed:
  // const minutes = Math.floor((diffSec % 3600) / 60);

  let result = "";
  if (days > 0) result += `${days} day${days > 1 ? "s" : ""} `;
  if (hours > 0) result += `${hours} hr${hours > 1 ? "s" : ""}`;
  return result.trim();
}

/**
 * Returns true if the given date is in the past
 * @param {string|Date} dateInput
 * @returns {boolean}
 */
export function isExpired(dateInput) {
  const now = new Date();
  const d = new Date(dateInput);
  return isNaN(d) ? false : d < now;
}

// ------------------
// PRICE & DISCOUNT HELPERS
// ------------------

/**
 * Format a number as USD (or change currency symbol here).
 * @param {number} amount
 * @returns {string} e.g. "$12.50"
 */
export function formatPrice(amount) {
  if (isNaN(amount)) return "";
  return `$${amount.toFixed(2)}`;
}

/**
 * Calculate the discount percentage between originalPrice and discountedPrice.
 * @param {number} originalPrice
 * @param {number} discountedPrice
 * @returns {number} e.g. 25 means “25% off”
 */
export function calculateDiscount(originalPrice, discountedPrice) {
  if (
    isNaN(originalPrice) ||
    isNaN(discountedPrice) ||
    originalPrice <= 0 ||
    discountedPrice <= 0 ||
    discountedPrice >= originalPrice
  ) {
    return 0;
  }
  const diff = originalPrice - discountedPrice;
  return Math.round((diff / originalPrice) * 100);
}


/**
 * Show a simple notification banner at top of page.
 * You can style ".notification" and ".notification.success"/".error"/".warning" in your CSS.
 * @param {string} message
 * @param {"success"|"error"|"warning"} type
 */
export function showNotification(message, type = "success") {
  // Create container if not already present
  let container = document.getElementById("notification-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "notification-container";
    container.style.position = "fixed";
    container.style.top = "20px";
    container.style.left = "50%";
    container.style.transform = "translateX(-50%)";
    container.style.zIndex = "9999";
    document.body.appendChild(container);
  }

  // Create a notification div
  const notif = document.createElement("div");
  notif.textContent = message;
  notif.className = `notification ${type}`; 
  // Style classes in your CSS, e.g.:
  //   .notification { padding: 12px 20px; margin-bottom: 8px; border-radius: 4px; color: #fff; }
  //   .notification.success { background: #28a745; }
  //   .notification.error { background: #dc3545; }
  //   .notification.warning { background: #ffc107; color: #000; }

  container.appendChild(notif);

  // Auto-dismiss after 3 seconds
  setTimeout(() => {
    notif.style.opacity = "0";
    setTimeout(() => {
      if (notif.parentNode) notif.parentNode.removeChild(notif);
    }, 500);
  }, 3000);
}

/**
 * Simple “open modal” utility (adds `.show` class and locks scroll).
 * Expects your modal HTML to have `<div id="your-modal" class="modal"> … </div>`,
 * and your CSS to hide it by default, then show when `.modal.show { display: block; }`
 * @param {HTMLElement} modalEl - the <div class="modal">…</div>
 */
export function openModal(modalEl) {
  if (!modalEl) return;
  modalEl.classList.add("show");
  document.body.style.overflow = "hidden"; // prevent background scroll
}

/**
 * Simple “close modal” utility (removes `.show` and restores scroll).
 * You can call: `modalEl.querySelector(".modal-close").addEventListener(...)` and call this.
 * @param {HTMLElement} modalEl
 */
export function closeModal(modalEl) {
  if (!modalEl) return;
  modalEl.classList.remove("show");
  document.body.style.overflow = "";
}
export function formatRelativeTime(date) {
  const now = new Date();
  const target = new Date(date);
  const diff = target - now;

  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min${minutes > 1 ? "s" : ""} left`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} left`;
  const days = Math.round(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} left`;
}
