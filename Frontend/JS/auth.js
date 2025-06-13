// 1. Save token & user into localStorage
const saveSession = (token, user) => {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
};

// 2. Read the logged-in user object, or null if none
const getCurrentUser = () => {
  const userJSON = localStorage.getItem("user");
  return userJSON ? JSON.parse(userJSON) : null;
};

// 3. Clear session (Logout)
const clearSession = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

// 4. Show or hide nav links based on login state & role
const updateNavBar = () => {
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
      // customer
      if (cartLink) cartLink.style.display = "block";
      if (adminLink) adminLink.style.display = "none";
      if (dashboardLink) dashboardLink.style.display = "none";
    }
  } else {
    // Not logged in
    if (loginLink) loginLink.style.display = "block";
    if (registerLink) registerLink.style.display = "block";
    if (logoutLink) logoutLink.style.display = "none";
    if (dashboardLink) dashboardLink.style.display = "none";
    if (adminLink) adminLink.style.display = "none";
    if (cartLink) cartLink.style.display = "none";
  }
};

// LOGIN FORM FUNCTIONALITY
document.addEventListener("DOMContentLoaded", () => {
  updateNavBar();

  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      clearSession();
      updateNavBar();
      window.location.href = "login.html";
    });
  }

  const loginForm = document.getElementById("login-form");
  const loginMessage = document.getElementById("login-message");

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      if (loginMessage) {
        loginMessage.style.display = "none";
        loginMessage.textContent = "";
      }

      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value.trim();

      try {
        const response = await fetch("http://localhost:5000/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!data.success) {
          if (loginMessage) {
            loginMessage.style.display = "block";
            loginMessage.textContent = data.message || "Login failed";
          }
          return;
        }

        saveSession(data.token, data.user);
        updateNavBar();

        // Redirect user by role
        if (data.user.role === "admin") {
          window.location.href = "admin.html";
        } else if (data.user.role === "business") {
          window.location.href = "dashboard.html";
        } else {
          window.location.href = "index.html";
        }
      } catch (err) {
        console.error("[Login Error]", err);
        if (loginMessage) {
          loginMessage.style.display = "block";
          loginMessage.textContent = "Network error. Please try again.";
        }
      }
    });
  }
});
// 5. Update Cart Count in Navbar
export function updateCartCount() {
  const cartCountEl = document.getElementById("cart-count");
  if (!cartCountEl) return;

  // You can either store cart in localStorage or later load from backend
  // For now, we'll fake it with a dummy number
  const cartItems = JSON.parse(localStorage.getItem("cartItems")) || [];
  cartCountEl.textContent = cartItems.length;
}



// EXPORT FOR OTHER MODULES

export default {
  getCurrentUser,
  saveSession,
  clearSession,
  updateNavBar,
  updateCartCount,
};
