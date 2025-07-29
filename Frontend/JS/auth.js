// auth.js

const API_BASE = "http://localhost:5000/api";
import { showNotification } from "./utils.js";

// -----------------
// Session Functions
// -----------------

export function saveSession(token, user) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
}

export function getCurrentUser() {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
}

export function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

export function logout() {
  clearSession();
  window.location.href = "login.html";
}

export function updateCartCount() {
  const cartCountEl = document.getElementById("cart-count");
  if (!cartCountEl) return;

  const cartItems = JSON.parse(localStorage.getItem("cartItems")) || [];
  cartCountEl.textContent = cartItems.length;
}

// -------------------------
// Role-Aware Navbar Handler
// -------------------------

export function updateNavBar() {
  const user = getCurrentUser();

  const loginLink = document.getElementById("login-link");
  const registerLink = document.getElementById("register-link");
  const logoutLink = document.getElementById("logout-link");
  const dashboardLink = document.getElementById("dashboard-link");
  const adminLink = document.getElementById("admin-link");
  const cartLink = document.getElementById("cart-link");

  if (user) {
    if (loginLink) loginLink.style.display = "none";
    if (registerLink) registerLink.style.display = "none";
    if (logoutLink) logoutLink.style.display = "block";

    if (user.role === "admin") {
      if (adminLink) adminLink.style.display = "block";
      if (dashboardLink) dashboardLink.style.display = "none";
      if (cartLink) cartLink.style.display = "none";
    } else if (user.role === "business") {
      if (dashboardLink) dashboardLink.style.display = "block";
      if (adminLink) adminLink.style.display = "none";
      if (cartLink) cartLink.style.display = "none";
    } else {
      if (cartLink) cartLink.style.display = "block";
      if (adminLink) adminLink.style.display = "none";
      if (dashboardLink) dashboardLink.style.display = "none";
    }
  } else {
    if (loginLink) loginLink.style.display = "block";
    if (registerLink) registerLink.style.display = "block";
    if (logoutLink) logoutLink.style.display = "none";
    if (dashboardLink) dashboardLink.style.display = "none";
    if (adminLink) adminLink.style.display = "none";
    if (cartLink) cartLink.style.display = "none";
  }
}

// ------------------
// DOM EVENT HANDLING
// ------------------

document.addEventListener("DOMContentLoaded", () => {
  updateNavBar();

  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      logout();
    });
  }

  // Handle Role-specific UI if needed (like hiding "Add to Cart")
  const currentUser = getCurrentUser();
  if (currentUser && currentUser.role !== "customer") {
    // Hide all add-to-cart buttons or features
    const addToCartButtons = document.querySelectorAll(".add-to-cart-btn");
    addToCartButtons.forEach((btn) => btn.style.display = "none");
  }

  // ----------------------
  // ✅ Register Logic
  // ----------------------
  const registerForm = document.getElementById("register-form");
  const registerMessage = document.getElementById("register-message");

  const roleSelect = document.getElementById("role");
  const businessFields = document.getElementById("business-fields");

  if (roleSelect && businessFields) {
    roleSelect.addEventListener("change", () => {
      businessFields.style.display = roleSelect.value === "business" ? "block" : "none";
    });
  }

  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      if (registerMessage) {
        registerMessage.style.display = "none";
        registerMessage.textContent = "";
      }

      const name = document.getElementById("name").value.trim();
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value.trim();
      const role = document.getElementById("role").value;

      const businessName = document.getElementById("businessName")?.value.trim() || "";
      const businessType = document.getElementById("businessType")?.value.trim() || "";

      const userData = { name, email, password, role };
      if (role === "business") {
        userData.businessName = businessName;
        userData.businessType = businessType;
      }

      try {
        const res = await fetch(`${API_BASE}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userData),
        });

        const data = await res.json();

        if (!data.success) {
          registerMessage.style.display = "block";
          registerMessage.textContent = data.message || "Registration failed";
          return;
        }

        saveSession(data.token, data.user);
        updateNavBar();

        if (data.user.role === "admin") {
          window.location.href = "admin.html";
        } else if (data.user.role === "business") {
          window.location.href = "dashboard.html";
        } else {
          window.location.href = "index.html";
        }
      } catch (err) {
        console.error("[Register Error]", err);
        registerMessage.style.display = "block";
        registerMessage.textContent = "Network error. Please try again.";
      }
    });
  }

  // ----------------------
  // ✅ Login Logic
  // ----------------------
  const loginForm = document.getElementById("login-form");
  const loginMessage = document.getElementById("login-message");

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      loginMessage.style.display = "none";
      loginMessage.textContent = "";

      const email = document.getElementById("login-email").value.trim();
      const password = document.getElementById("login-password").value.trim();

      try {
        const res = await fetch(`${API_BASE}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();

        if (!data.success) {
          loginMessage.style.display = "block";
          loginMessage.textContent = data.message || "Login failed";
          return;
        }

        saveSession(data.token, data.user);
        updateNavBar();

        if (data.user.role === "admin") {
          window.location.href = "admin.html";
        } else if (data.user.role === "business") {
          window.location.href = "dashboard.html";
        } else {
          window.location.href = "index.html";
        }
      } catch (err) {
        console.error("[Login Error]", err);
        loginMessage.style.display = "block";
        loginMessage.textContent = "Network error. Please try again.";
      }
    });
  }
});

// ------------------------
// EXPORT FOR OTHER MODULES
// ------------------------

export default {
  getCurrentUser,
  saveSession,
  clearSession,
  updateNavBar,
  updateCartCount,
};
