/**
 * Dashboard functionality for SaveBite application
 */
import apiService from "./api.js";
import authService from "./auth.js";
import listingService from "./listing.js";
import {
  formatDate,
  formatPrice,
  formatRelativeTime,
  showNotification,
} from "./utils.js";

/**
 * DashboardService class for handling dashboard-related operations
 */
class DashboardService {
  constructor() {
    this.init();
  }

  /**
   * Initialize the dashboard
   */
  init() {
    // Check if user is on dashboard page
    if (!document.querySelector(".dashboard-container")) {
      return;
    }

    // Check if user is authorized
    const currentUser = authService.getCurrentUser();
    if (
      !currentUser ||
      (currentUser.role !== "business" && currentUser.role !== "admin")
    ) {
      window.location.href = "index.html";
      return;
    }

    // Update user info
    this.updateUserInfo(currentUser);

    // Set up tabs
    this.setupTabs();

    // Load dashboard data
    this.loadDashboardData();
  }

  /**
   * Update user information in the sidebar
   * @param {Object} user - User object
   */
  updateUserInfo(user) {
    const nameEl = document.getElementById("user-name");
    const emailEl = document.getElementById("user-email");

    if (nameEl) {
      nameEl.textContent = user.businessName || user.name;
    }

    if (emailEl) {
      emailEl.textContent = user.email;
    }
  }

  /**
   * Set up dashboard tabs
   */
  setupTabs() {
    const tabLinks = document.querySelectorAll(".sidebar-nav li");
    const tabContents = document.querySelectorAll(".dashboard-tab");

    if (!tabLinks.length || !tabContents.length) return;

    tabLinks.forEach((link) => {
      link.addEventListener("click", () => {
        // Remove active class from all links
        tabLinks.forEach((l) => l.classList.remove("active"));

        // Add active class to clicked link
        link.classList.add("active");

        // Show corresponding tab content
        const tabId = link.getAttribute("data-tab");

        tabContents.forEach((tab) => {
          if (tab.id === tabId) {
            tab.classList.add("active");
          } else {
            tab.classList.remove("active");
          }
        });

        // Load tab-specific data
        this.loadTabData(tabId);
      });
    });
  }

  /**
   * Load data for specific tab
   * @param {string} tabId - Tab ID
   */
  loadTabData(tabId) {
    switch (tabId) {
      case "overview":
        this.loadOverviewData();
        break;
      case "listings":
        this.loadListingsData();
        break;
      case "orders":
        this.loadOrdersData();
        break;
      case "settings":
        this.loadSettingsData();
        break;
    }
  }

  /**
   * Load dashboard data
   */
  async loadDashboardData() {
    // Get stats
    try {
      const result = await apiService.getStats("business");

      if (result.success) {
        this.updateDashboardStats(result.stats);
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    }
  }

  /**
   * Update dashboard statistics
   * @param {Object} stats - Dashboard statistics
   */
  updateDashboardStats(stats) {
    // Update stats cards
    const activeListingsCount = document.getElementById(
      "active-listings-count"
    );
    const pendingOrdersCount = document.getElementById("pending-orders-count");
    const foodSavedCount = document.getElementById("food-saved-count");

    if (activeListingsCount)
      activeListingsCount.textContent = stats.activeListings;
    if (pendingOrdersCount)
      pendingOrdersCount.textContent = stats.pendingOrders;
    if (foodSavedCount) foodSavedCount.textContent = stats.foodSaved;

    // Update recent activity
    this.updateRecentActivity(stats.recentActivity);

    // Update expiring listings
    this.updateExpiringListings(stats.expiringListings);
  }

  /**
   * Update recent activity list
   * @param {Array} activities - Recent activities
   */
  updateRecentActivity(activities) {
    const activityList = document.getElementById("activity-list");
    if (!activityList) return;

    if (!activities || activities.length === 0) {
      activityList.innerHTML = `
                <div class="no-activity">
                    <p>No recent activity</p>
                </div>
            `;
      return;
    }

    let activitiesHTML = "";

    activities.forEach((activity) => {
      // Get icon based on activity type
      let iconClass = "fas fa-info-circle";
      let iconColor = "var(--info-color)";

      switch (activity.type) {
        case "listing-created":
          iconClass = "fas fa-plus-circle";
          iconColor = "var(--success-color)";
          break;
        case "listing-updated":
          iconClass = "fas fa-edit";
          iconColor = "var(--primary-color)";
          break;
        case "order-placed":
          iconClass = "fas fa-shopping-cart";
          iconColor = "var(--accent-color)";
          break;
        case "order-completed":
          iconClass = "fas fa-check-circle";
          iconColor = "var(--success-color)";
          break;
      }

      activitiesHTML += `
                <div class="activity-item">
                    <div class="activity-icon" style="background-color: ${iconColor}20; color: ${iconColor}">
                        <i class="${iconClass}"></i>
                    </div>
                    <div class="activity-info">
                        <h4>${activity.message}</h4>
                        <p>${formatRelativeTime(activity.timestamp)}</p>
                    </div>
                </div>
            `;
    });

    activityList.innerHTML = activitiesHTML;
  }

  /**
   * Update expiring listings list
   * @param {Array} listings - Expiring listings
   */
  updateExpiringListings(listings) {
    const expiringList = document.getElementById("expiring-list");
    if (!expiringList) return;

    if (!listings || listings.length === 0) {
      expiringList.innerHTML = `
                <div class="no-expiring">
                    <p>No listings expiring soon</p>
                </div>
            `;
      return;
    }

    let listingsHTML = "";

    listings.forEach((listing) => {
      listingsHTML += `
                <div class="expiring-item">
                    <div class="expiring-icon" style="background-color: var(--warning-color)20; color: var(--warning-color)">
                        <i class="fas fa-clock"></i>
                    </div>
                    <div class="expiring-info">
                        <h4>${listing.foodName}</h4>
                        <p>Expires ${formatRelativeTime(listing.expiryDate)}</p>
                    </div>
                    <div class="expiring-time">
                        <button class="btn btn-small" data-id="${
                          listing.id
                        }">Edit</button>
                    </div>
                </div>
            `;
    });

    expiringList.innerHTML = listingsHTML;

    // Add event listeners to edit buttons
    const editButtons = expiringList.querySelectorAll("button");
    editButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const listingId = button.getAttribute("data-id");

        // Switch to listings tab
        document.querySelector('[data-tab="listings"]').click();

        // Show edit modal
        setTimeout(() => {
          listingService.showEditListingModal(listingId);
        }, 300);
      });
    });
  }

  /**
   * Load overview tab data
   */
  loadOverviewData() {
    // Already loaded in loadDashboardData
  }

  /**
   * Load listings tab data
   */
  loadListingsData() {
    const listingsTableBody = document.getElementById("listings-table-body");
    if (listingsTableBody) {
      listingService.renderBusinessListings(listingsTableBody);
    }
  }

  /**
   * Load orders tab data
   */
  async loadOrdersData() {
    const ordersContainer = document.getElementById("orders-container");
    const noOrders = document.getElementById("no-orders");

    if (!ordersContainer) return;

    // Show loading state
    ordersContainer.innerHTML = `
            <div class="loading-spinner">
                <i class="fas fa-spinner fa-spin"></i>
            </div>
        `;

    try {
      // Get current user
      const currentUser = authService.getCurrentUser();
      if (!currentUser) return;

      // Get orders for current business
      const filter = document.getElementById("orders-filter");
      const filterValue = filter ? filter.value : "all";

      const orders = await apiService.getOrders({
        businessId: currentUser.id,
        status: filterValue,
      });

      if (orders.length === 0) {
        // Show no orders message
        if (noOrders) noOrders.style.display = "block";
        ordersContainer.innerHTML = "";
        return;
      }

      // Hide no orders message
      if (noOrders) noOrders.style.display = "none";

      // Generate orders HTML
      let ordersHTML = "";

      orders.forEach((order) => {
        // Filter items to only include those from this business
        const businessItems = order.items.filter(
          (item) => item.businessId === currentUser.id
        );

        // Calculate business subtotal
        const businessSubtotal = businessItems.reduce(
          (total, item) => total + item.discountedPrice * item.quantity,
          0
        );

        // Get status class
        let statusClass = "";
        switch (order.status) {
          case "pending":
            statusClass = "pending";
            break;
          case "completed":
            statusClass = "completed";
            break;
          case "cancelled":
            statusClass = "cancelled";
            break;
        }

        ordersHTML += `
                    <div class="order-card">
                        <div class="order-header">
                            <span class="order-id">Order #${order.id
                              .substring(0, 8)
                              .toUpperCase()}</span>
                            <span class="order-status ${statusClass}">${
          order.status.charAt(0).toUpperCase() + order.status.slice(1)
        }</span>
                        </div>
                        
                        <div class="order-items">
                            ${businessItems
                              .map(
                                (item) => `
                                <div class="order-item">
                                    <div class="order-item-info">
                                        <span class="order-item-name">${
                                          item.name
                                        }</span>
                                        <small>Qty: ${item.quantity}</small>
                                    </div>
                                    <span class="order-item-price">${formatPrice(
                                      item.discountedPrice * item.quantity
                                    )}</span>
                                </div>
                            `
                              )
                              .join("")}
                        </div>
                        
                        <div class="order-subtotal">
                            <strong>Subtotal:</strong> ${formatPrice(
                              businessSubtotal
                            )}
                        </div>
                        
                        <div class="order-customer">
                            <h4><i class="fas fa-user"></i> Customer Information</h4>
                            <p>${order.customerName}</p>
                            <p>${order.customerEmail}</p>
                            <p>${order.customerPhone}</p>
                            <p><strong>Pickup Time:</strong> ${formatDate(
                              order.pickupTime,
                              true
                            )}</p>
                            ${
                              order.notes
                                ? `<p><strong>Notes:</strong> ${order.notes}</p>`
                                : ""
                            }
                        </div>
                        
                        ${
                          order.status === "pending"
                            ? `
                            <div class="order-actions">
                                <button class="btn btn-primary complete-order" data-id="${order.id}">Mark as Completed</button>
                                <button class="btn btn-secondary cancel-order" data-id="${order.id}">Cancel Order</button>
                            </div>
                        `
                            : ""
                        }
                    </div>
                `;
      });

      // Update orders container
      ordersContainer.innerHTML = ordersHTML;

      // Add event listeners
      const completeButtons =
        ordersContainer.querySelectorAll(".complete-order");
      const cancelButtons = ordersContainer.querySelectorAll(".cancel-order");

      completeButtons.forEach((button) => {
        button.addEventListener("click", async () => {
          const orderId = button.getAttribute("data-id");
          await this.updateOrderStatus(orderId, "completed");
        });
      });

      cancelButtons.forEach((button) => {
        button.addEventListener("click", async () => {
          const orderId = button.getAttribute("data-id");
          await this.updateOrderStatus(orderId, "cancelled");
        });
      });
    } catch (error) {
      console.error("Error loading orders:", error);
      ordersContainer.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <h3>Error loading orders</h3>
                    <p>Please try again later</p>
                </div>
            `;
    }
  }

  /**
   * Update order status
   * @param {string} orderId - Order ID
   * @param {string} status - New status
   */
  async updateOrderStatus(orderId, status) {
    try {
      // Confirm status change
      const confirmMessage =
        status === "completed"
          ? "Are you sure you want to mark this order as completed?"
          : "Are you sure you want to cancel this order?";

      if (!confirm(confirmMessage)) {
        return;
      }

      const result = await apiService.updateOrderStatus(orderId, status);

      if (result.success) {
        showNotification(
          `Order ${
            status === "completed" ? "completed" : "cancelled"
          } successfully`,
          "success"
        );

        // Reload orders
        this.loadOrdersData();

        // Reload dashboard data
        this.loadDashboardData();
      } else {
        showNotification(result.message, "error");
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      showNotification("Error updating order status", "error");
    }
  }

  /**
   * Load settings tab data
   */
  loadSettingsData() {
    // Get current user
    const currentUser = authService.getCurrentUser();
    if (!currentUser) return;

    // Populate form fields
    const businessNameInput = document.getElementById("business-name");
    const businessTypeInput = document.getElementById("business-type");
    const businessAddressInput = document.getElementById("business-address");
    const businessDescriptionInput = document.getElementById(
      "business-description"
    );
    const contactNameInput = document.getElementById("contact-name");
    const contactEmailInput = document.getElementById("contact-email");
    const contactPhoneInput = document.getElementById("contact-phone");

    if (businessNameInput)
      businessNameInput.value = currentUser.businessName || "";
    if (businessTypeInput)
      businessTypeInput.value = currentUser.businessType || "other";
    if (businessAddressInput)
      businessAddressInput.value = currentUser.businessAddress || "";
    if (businessDescriptionInput)
      businessDescriptionInput.value = currentUser.businessDescription || "";
    if (contactNameInput) contactNameInput.value = currentUser.name || "";
    if (contactEmailInput) contactEmailInput.value = currentUser.email || "";
    if (contactPhoneInput) contactPhoneInput.value = currentUser.phone || "";

    // Set up form submission
    const settingsForm = document.getElementById("business-settings-form");
    if (settingsForm) {
      settingsForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        await this.saveSettings(settingsForm);
      });
    }
  }

  /**
   * Save settings form
   * @param {HTMLFormElement} form - Settings form
   */
  async saveSettings(form) {
    try {
      // Get current user
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        showNotification("Please log in to save settings", "error");
        return;
      }

      // Get form data
      const formData = new FormData(form);

      // Create updated user data
      const userData = {
        name: formData.get("contactName"),
        email: formData.get("contactEmail"),
        phone: formData.get("contactPhone"),
        businessName: formData.get("businessName"),
        businessType: formData.get("businessType"),
        businessAddress: formData.get("businessAddress"),
        businessDescription: formData.get("businessDescription"),
      };

      // Check if password is being changed
      const currentPassword = formData.get("currentPassword");
      const newPassword = formData.get("newPassword");
      const confirmPassword = formData.get("confirmPassword");

      if (currentPassword && newPassword) {
        // Validate passwords
        if (newPassword !== confirmPassword) {
          showNotification("New passwords do not match", "error");
          return;
        }

        if (currentPassword !== currentUser.password) {
          showNotification("Current password is incorrect", "error");
          return;
        }

        // Update password
        userData.password = newPassword;
      }

      // Update user profile
      const result = await apiService.updateUserProfile(
        currentUser.id,
        userData
      );

      if (result.success) {
        showNotification("Settings saved successfully", "success");

        // Update user info in the sidebar
        this.updateUserInfo(result.user);

        // Reset password fields
        const passwordFields = form.querySelectorAll('input[type="password"]');
        passwordFields.forEach((field) => (field.value = ""));
      } else {
        showNotification(result.message, "error");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      showNotification("Error saving settings", "error");
    }
  }
}

// Initialize dashboard service when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new DashboardService();
});

export default DashboardService;
