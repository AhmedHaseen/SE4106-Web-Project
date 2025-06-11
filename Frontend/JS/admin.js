/**
 * Admin functionality for SaveBite application
 */
import apiService from "./api.js";
import authService from "./auth.js";
import {
  formatDate,
  formatPrice,
  formatRelativeTime,
  showNotification,
  openModal,
} from "./utils.js";

/**
 * AdminService class for handling admin-related operations
 */
class AdminService {
  constructor() {
    this.init();
  }

  /**
   * Initialize the admin panel
   */
  init() {
    // Check if user is on admin page
    if (!document.querySelector(".admin-container")) {
      return;
    }

    // Check if user is authorized
    const currentUser = authService.getCurrentUser();
    if (!currentUser || currentUser.role !== "admin") {
      window.location.href = "index.html";
      return;
    }

    // Update admin info
    this.updateAdminInfo(currentUser);

    // Set up tabs
    this.setupTabs();

    // Load admin data
    this.loadAdminData();
  }

  /**
   * Update admin information in the sidebar
   * @param {Object} admin - Admin user object
   */
  updateAdminInfo(admin) {
    const nameEl = document.getElementById("admin-name");
    const emailEl = document.getElementById("admin-email");

    if (nameEl) {
      nameEl.textContent = admin.name;
    }

    if (emailEl) {
      emailEl.textContent = admin.email;
    }
  }

  /**
   * Set up admin tabs
   */
  setupTabs() {
    const tabLinks = document.querySelectorAll(".sidebar-nav li");
    const tabContents = document.querySelectorAll(".admin-tab");

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
      case "dashboard":
        this.loadDashboardData();
        break;
      case "users":
        this.loadUsersData();
        break;
      case "listings":
        this.loadListingsData();
        break;
      case "orders":
        this.loadOrdersData();
        break;
      case "reports":
        this.loadReportsData();
        break;
      case "settings":
        this.loadSettingsData();
        break;
    }
  }

  /**
   * Load admin dashboard data
   */
  async loadAdminData() {
    // Get stats
    try {
      const result = await apiService.getStats("admin");

      if (result.success) {
        this.updateAdminStats(result.stats);
      }
    } catch (error) {
      console.error("Error loading admin data:", error);
    }
  }

  /**
   * Update admin statistics
   * @param {Object} stats - Admin statistics
   */
  updateAdminStats(stats) {
    // Update stats cards
    const totalUsers = document.getElementById("total-users");
    const totalBusinesses = document.getElementById("total-businesses");
    const totalListings = document.getElementById("total-listings");
    const totalOrders = document.getElementById("total-orders");

    if (totalUsers) totalUsers.textContent = stats.totalUsers;
    if (totalBusinesses) totalBusinesses.textContent = stats.totalBusinesses;
    if (totalListings) totalListings.textContent = stats.activeListings;
    if (totalOrders) totalOrders.textContent = stats.totalOrders;

    // Update recent activity
    this.updateRecentActivity(stats.recentActivity);

    // Update other dashboard elements
    this.updateCharts(stats);
  }

  /**
   * Update charts with statistics
   * @param {Object} stats - Statistics for charts
   */
  updateCharts(stats) {
    // This is a placeholder for chart updates
    // In a real app, this would update chart visualizations

    // Update report values (in reports tab)
    const foodWasteReducedEl = document.getElementById("food-waste-reduced");
    const co2EmissionsAvoidedEl = document.getElementById(
      "co2-emissions-avoided"
    );
    const totalRevenueEl = document.getElementById("total-revenue");
    const userGrowthEl = document.getElementById("user-growth");

    if (foodWasteReducedEl)
      foodWasteReducedEl.textContent = stats.totalFoodSaved || 1500;
    if (co2EmissionsAvoidedEl)
      co2EmissionsAvoidedEl.textContent = stats.totalFoodSaved * 2.5 || 3750;
    if (totalRevenueEl)
      totalRevenueEl.textContent = Math.floor(stats.totalRevenue) || 12450;
    if (userGrowthEl) userGrowthEl.textContent = stats.totalUsers || 245;
  }

  /**
   * Update recent activity list
   * @param {Array} activities - Recent activities
   */
  updateRecentActivity(activities) {
    const activityList = document.getElementById("admin-activity-list");
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
   * Load dashboard tab data
   */
  loadDashboardData() {
    // Already loaded in loadAdminData
  }

  /**
   * Load users tab data
   */
  async loadUsersData() {
    const usersTableBody = document.getElementById("users-table-body");
    if (!usersTableBody) return;

    // Show loading state
    usersTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">
                    <div class="loading-spinner">
                        <i class="fas fa-spinner fa-spin"></i>
                    </div>
                </td>
            </tr>
        `;

    try {
      // Get filter value
      const filter = document.getElementById("users-filter");
      const filterValue = filter ? filter.value : "all";

      // Get search value
      const search = document.getElementById("users-search");
      const searchValue = search ? search.value : "";

      // Get users
      const result = await apiService.getUsers({
        role: filterValue !== "all" ? filterValue.slice(0, -1) : "", // Remove 's' from end
        search: searchValue,
      });

      if (!result.success) {
        usersTableBody.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center">
                            <p>${result.message}</p>
                        </td>
                    </tr>
                `;
        return;
      }

      const users = result.users;

      if (users.length === 0) {
        usersTableBody.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center">
                            <p>No users found</p>
                        </td>
                    </tr>
                `;
        return;
      }

      // Generate table rows
      let tableRows = "";

      users.forEach((user) => {
        // Skip current admin user (can't manage self)
        const currentUser = authService.getCurrentUser();
        const isSelf = currentUser && currentUser.id === user.id;

        // Format joined date
        const joinedDate = formatDate(user.createdAt);

        // Get status class
        let statusClass = "";
        switch (user.status) {
          case "active":
            statusClass = "active";
            break;
          case "blocked":
            statusClass = "blocked";
            break;
          case "pending":
            statusClass = "pending";
            break;
        }

        tableRows += `
                    <tr>
                        <td>${
                          user.role === "business"
                            ? user.businessName || user.name
                            : user.name
                        }</td>
                        <td>${user.email}</td>
                        <td>${
                          user.role.charAt(0).toUpperCase() + user.role.slice(1)
                        }</td>
                        <td>${joinedDate}</td>
                        <td><span class="user-status ${statusClass}">${
          user.status.charAt(0).toUpperCase() + user.status.slice(1)
        }</span></td>
                        <td>
                            <div class="user-actions">
                                <button class="view" data-id="${
                                  user.id
                                }"><i class="fas fa-eye"></i></button>
                                ${
                                  !isSelf
                                    ? `
                                    <button class="${
                                      user.status === "blocked"
                                        ? "edit"
                                        : "block"
                                    }" data-id="${user.id}" data-action="${
                                        user.status === "blocked"
                                          ? "active"
                                          : "blocked"
                                      }">
                                        <i class="fas ${
                                          user.status === "blocked"
                                            ? "fa-check-circle"
                                            : "fa-ban"
                                        }"></i>
                                    </button>
                                `
                                    : ""
                                }
                            </div>
                        </td>
                    </tr>
                `;
      });

      // Update table body
      usersTableBody.innerHTML = tableRows;

      // Add event listeners
      const viewButtons = usersTableBody.querySelectorAll(".view");
      const actionButtons = usersTableBody.querySelectorAll(".block, .edit");

      viewButtons.forEach((button) => {
        button.addEventListener("click", () => {
          const userId = button.getAttribute("data-id");
          this.showUserDetails(userId);
        });
      });

      actionButtons.forEach((button) => {
        button.addEventListener("click", async () => {
          const userId = button.getAttribute("data-id");
          const action = button.getAttribute("data-action");
          await this.updateUserStatus(userId, action);
        });
      });
    } catch (error) {
      console.error("Error loading users:", error);
      usersTableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center">
                        <p>Error loading users. Please try again later.</p>
                    </td>
                </tr>
            `;
    }
  }

  /**
   * Show user details modal
   * @param {string} userId - User ID
   */
  async showUserDetails(userId) {
    const modal = document.getElementById("user-details-modal");
    const detailsContainer = document.getElementById("user-details");

    if (!modal || !detailsContainer) {
      console.error("User details modal or container not found");
      return;
    }

    // Show loading state
    detailsContainer.innerHTML = `
            <div class="loading-spinner">
                <i class="fas fa-spinner fa-spin"></i>
            </div>
        `;

    openModal(modal);

    try {
      // Get user details
      const result = await apiService.getUserById(userId);

      if (!result.success) {
        detailsContainer.innerHTML = `
                    <div class="error-message">
                        <i class="fas fa-exclamation-circle"></i>
                        <h3>Error</h3>
                        <p>${result.message}</p>
                    </div>
                `;
        return;
      }

      const user = result.user;

      // Format role class
      let roleClass = "";
      switch (user.role) {
        case "admin":
          roleClass = "admin";
          break;
        case "business":
          roleClass = "business";
          break;
        case "customer":
          roleClass = "customer";
          break;
      }

      // Create user details HTML
      let userDetailsHTML = `
                <div class="user-details-header">
                    <div class="user-details-avatar">
                        <i class="fas ${
                          user.role === "admin"
                            ? "fa-user-shield"
                            : user.role === "business"
                            ? "fa-store"
                            : "fa-user"
                        }"></i>
                    </div>
                    <div class="user-details-info">
                        <h3>${
                          user.role === "business"
                            ? user.businessName || user.name
                            : user.name
                        }</h3>
                        <span class="user-details-role ${roleClass}">${
        user.role.charAt(0).toUpperCase() + user.role.slice(1)
      }</span>
                        <p>${user.email}</p>
                    </div>
                </div>
                
                <div class="user-details-section">
                    <h4>Basic Information</h4>
                    <div class="user-details-item">
                        <span class="user-details-label">Name</span>
                        <span class="user-details-value">${user.name}</span>
                    </div>
                    <div class="user-details-item">
                        <span class="user-details-label">Email</span>
                        <span class="user-details-value">${user.email}</span>
                    </div>
                    <div class="user-details-item">
                        <span class="user-details-label">Status</span>
                        <span class="user-details-value">
                            <span class="user-status ${user.status}">${
        user.status.charAt(0).toUpperCase() + user.status.slice(1)
      }</span>
                        </span>
                    </div>
                    <div class="user-details-item">
                        <span class="user-details-label">Joined</span>
                        <span class="user-details-value">${formatDate(
                          user.createdAt
                        )}</span>
                    </div>
                </div>
            `;

      // Add business-specific information if applicable
      if (user.role === "business") {
        userDetailsHTML += `
                    <div class="user-details-section">
                        <h4>Business Information</h4>
                        <div class="user-details-item">
                            <span class="user-details-label">Business Name</span>
                            <span class="user-details-value">${
                              user.businessName || "Not provided"
                            }</span>
                        </div>
                        <div class="user-details-item">
                            <span class="user-details-label">Business Type</span>
                            <span class="user-details-value">${
                              this.formatBusinessType(user.businessType) ||
                              "Not provided"
                            }</span>
                        </div>
                        <div class="user-details-item">
                            <span class="user-details-label">Address</span>
                            <span class="user-details-value">${
                              user.businessAddress || "Not provided"
                            }</span>
                        </div>
                        <div class="user-details-item">
                            <span class="user-details-label">Description</span>
                            <span class="user-details-value">${
                              user.businessDescription || "Not provided"
                            }</span>
                        </div>
                    </div>
                `;
      }

      // Add action buttons
      const currentUser = authService.getCurrentUser();
      const isSelf = currentUser && currentUser.id === user.id;

      if (!isSelf) {
        userDetailsHTML += `
                    <div class="user-details-actions">
                        ${
                          user.status === "blocked"
                            ? `
                            <button class="btn btn-primary activate-user" data-id="${user.id}">Activate User</button>
                        `
                            : `
                            <button class="btn btn-danger block-user" data-id="${user.id}">Block User</button>
                        `
                        }
                    </div>
                `;
      }

      // Update details container
      detailsContainer.innerHTML = userDetailsHTML;

      // Add event listeners
      const activateButton = detailsContainer.querySelector(".activate-user");
      const blockButton = detailsContainer.querySelector(".block-user");

      if (activateButton) {
        activateButton.addEventListener("click", async () => {
          const result = await this.updateUserStatus(userId, "active");
          if (result) {
            modal.querySelector(".modal-close").click();
          }
        });
      }

      if (blockButton) {
        blockButton.addEventListener("click", async () => {
          const result = await this.updateUserStatus(userId, "blocked");
          if (result) {
            modal.querySelector(".modal-close").click();
          }
        });
      }
    } catch (error) {
      console.error("Error showing user details:", error);
      detailsContainer.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <h3>Error loading user details</h3>
                    <p>Please try again later</p>
                </div>
            `;
    }
  }

  /**
   * Format business type for display
   * @param {string} type - Business type
   * @returns {string} Formatted business type
   */
  formatBusinessType(type) {
    if (!type) return "";

    switch (type) {
      case "restaurant":
        return "Restaurant";
      case "cafe":
        return "Café";
      case "bakery":
        return "Bakery";
      case "grocery":
        return "Grocery Store";
      case "other":
        return "Other";
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  }

  /**
   * Update user status (block/unblock)
   * @param {string} userId - User ID
   * @param {string} status - New status
   * @returns {Promise<boolean>} Success status
   */
  async updateUserStatus(userId, status) {
    try {
      // Confirm status change
      const confirmMessage =
        status === "blocked"
          ? "Are you sure you want to block this user? They will not be able to log in."
          : "Are you sure you want to activate this user?";

      if (!confirm(confirmMessage)) {
        return false;
      }

      const result = await apiService.updateUserStatus(userId, status);

      if (result.success) {
        showNotification(result.message, "success");

        // Reload users data
        this.loadUsersData();

        return true;
      } else {
        showNotification(result.message, "error");
        return false;
      }
    } catch (error) {
      console.error("Error updating user status:", error);
      showNotification("Error updating user status", "error");
      return false;
    }
  }

  /**
   * Load listings tab data
   */
  async loadListingsData() {
    const listingsContainer = document.getElementById(
      "admin-listings-container"
    );
    if (!listingsContainer) return;

    // Show loading state
    listingsContainer.innerHTML = `
            <div class="loading-spinner">
                <i class="fas fa-spinner fa-spin"></i>
            </div>
        `;

    try {
      // Get filter value
      const filter = document.getElementById("admin-listings-filter");
      const filterValue = filter ? filter.value : "all";

      // Get search value
      const search = document.getElementById("admin-listings-search");
      const searchValue = search ? search.value : "";

      // Get listings
      const listings = await apiService.getListings({
        status: filterValue !== "all" ? filterValue : "",
        search: searchValue,
      });

      if (listings.length === 0) {
        listingsContainer.innerHTML = `
                    <div class="no-results">
                        <i class="fas fa-search"></i>
                        <h3>No listings found</h3>
                        <p>Try adjusting your search or filters</p>
                    </div>
                `;
        return;
      }

      // Generate listings HTML
      let listingsHTML = "";

      listings.forEach((listing) => {
        // Get status class
        let statusClass = "";
        let statusText = "";

        if (listing.status === "active") {
          if (new Date(listing.expiryDate) < new Date()) {
            statusClass = "expired";
            statusText = "Expired";
          } else {
            statusClass = "active";
            statusText = "Active";
          }
        } else if (listing.status === "sold-out") {
          statusClass = "sold-out";
          statusText = "Sold Out";
        } else {
          statusClass = "expired";
          statusText = "Expired";
        }

        // Calculate discount
        const discountPercentage = Math.round(
          ((listing.originalPrice - listing.discountedPrice) /
            listing.originalPrice) *
            100
        );

        listingsHTML += `
                    <div class="admin-listing-card">
                        <div class="admin-listing-image">
                            <img src="${listing.imageUrl}" alt="${
          listing.foodName
        }">
                        </div>
                        <div class="admin-listing-content">
                            <div class="admin-listing-header">
                                <h3 class="admin-listing-title">${
                                  listing.foodName
                                }</h3>
                                <span class="admin-listing-status ${statusClass}">${statusText}</span>
                            </div>
                            <p class="admin-listing-business">
                                <i class="fas fa-store"></i> ${
                                  listing.businessName
                                }
                            </p>
                            <div class="admin-listing-details">
                                <span class="admin-listing-expiry">
                                    <i class="fas fa-calendar-alt"></i> ${formatDate(
                                      listing.expiryDate
                                    )}
                                </span>
                                <span class="admin-listing-quantity">
                                    <i class="fas fa-cubes"></i> ${
                                      listing.quantity
                                    } left
                                </span>
                            </div>
                            <div class="admin-listing-price">
                                <div class="admin-listing-price-group">
                                    <span class="admin-original-price">${formatPrice(
                                      listing.originalPrice
                                    )}</span>
                                    <span class="admin-discounted-price">${formatPrice(
                                      listing.discountedPrice
                                    )}</span>
                                </div>
                                <span class="listing-detail-discount">-${discountPercentage}%</span>
                            </div>
                            <div class="admin-listing-actions">
                                <button class="view" data-id="${
                                  listing.id
                                }"><i class="fas fa-eye"></i></button>
                                <button class="remove" data-id="${
                                  listing.id
                                }"><i class="fas fa-trash-alt"></i></button>
                            </div>
                        </div>
                    </div>
                `;
      });

      // Update listings container
      listingsContainer.innerHTML = listingsHTML;

      // Add event listeners
      const viewButtons = listingsContainer.querySelectorAll(".view");
      const removeButtons = listingsContainer.querySelectorAll(".remove");

      viewButtons.forEach((button) => {
        button.addEventListener("click", () => {
          const listingId = button.getAttribute("data-id");
          this.viewListing(listingId);
        });
      });

      removeButtons.forEach((button) => {
        button.addEventListener("click", async () => {
          const listingId = button.getAttribute("data-id");
          await this.removeListing(listingId);
        });
      });
    } catch (error) {
      console.error("Error loading listings:", error);
      listingsContainer.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <h3>Error loading listings</h3>
                    <p>Please try again later</p>
                </div>
            `;
    }
  }

  /**
   * View listing details
   * @param {string} listingId - Listing ID
   */
  viewListing(listingId) {
    // Redirect to listings page with listing ID
    window.location.href = `listings.html?id=${listingId}`;
  }

  /**
   * Remove a listing
   * @param {string} listingId - Listing ID
   */
  async removeListing(listingId) {
    try {
      // Confirm removal
      if (
        !confirm(
          "Are you sure you want to remove this listing? This action cannot be undone."
        )
      ) {
        return;
      }

      const result = await apiService.deleteListing(listingId);

      if (result.success) {
        showNotification("Listing removed successfully", "success");

        // Reload listings
        this.loadListingsData();
      } else {
        showNotification(result.message, "error");
      }
    } catch (error) {
      console.error("Error removing listing:", error);
      showNotification("Error removing listing", "error");
    }
  }

  /**
   * Load orders tab data
   */
  async loadOrdersData() {
    const ordersContainer = document.getElementById("admin-orders-container");
    if (!ordersContainer) return;

    // Show loading state
    ordersContainer.innerHTML = `
            <div class="loading-spinner">
                <i class="fas fa-spinner fa-spin"></i>
            </div>
        `;

    try {
      // Get filter value
      const filter = document.getElementById("admin-orders-filter");
      const filterValue = filter ? filter.value : "all";

      // Get search value
      const search = document.getElementById("admin-orders-search");
      const searchValue = search ? search.value : "";

      // Get orders
      const orders = await apiService.getOrders({
        status: filterValue !== "all" ? filterValue : "",
        search: searchValue,
      });

      if (orders.length === 0) {
        ordersContainer.innerHTML = `
                    <div class="no-results">
                        <i class="fas fa-search"></i>
                        <h3>No orders found</h3>
                        <p>Try adjusting your search or filters</p>
                    </div>
                `;
        return;
      }

      // Generate orders HTML
      let ordersHTML = "";

      orders.forEach((order) => {
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
                    <div class="admin-order-card">
                        <div class="admin-order-header">
                            <span class="admin-order-id">Order #${order.id
                              .substring(0, 8)
                              .toUpperCase()}</span>
                            <span class="admin-order-status ${statusClass}">${
          order.status.charAt(0).toUpperCase() + order.status.slice(1)
        }</span>
                        </div>
                        
                        <div class="admin-order-customer">
                            <h4><i class="fas fa-user"></i> Customer</h4>
                            <p>${order.customerName}</p>
                            <p>${order.customerEmail}</p>
                            <p>${order.customerPhone || "No phone provided"}</p>
                        </div>
                        
                        <div class="admin-order-business">
                            <h4><i class="fas fa-store"></i> Pickup Location</h4>
                            <p>${order.pickupLocationName}</p>
                            <p>${order.pickupAddress}</p>
                            <p><strong>Pickup Time:</strong> ${formatDate(
                              order.pickupTime,
                              true
                            )}</p>
                        </div>
                        
                        <div class="admin-order-details">
                            <h4>Order Details</h4>
                            ${order.items
                              .map(
                                (item) => `
                                <div class="admin-order-item">
                                    <span>${item.name} x${item.quantity}</span>
                                    <span>${formatPrice(
                                      item.discountedPrice * item.quantity
                                    )}</span>
                                </div>
                            `
                              )
                              .join("")}
                            <div class="admin-order-total">
                                <span>Total</span>
                                <span>${formatPrice(order.total)}</span>
                            </div>
                        </div>
                    </div>
                `;
      });

      // Update orders container
      ordersContainer.innerHTML = ordersHTML;
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
   * Load reports tab data
   */
  loadReportsData() {
    // Most data is already loaded in loadAdminData
    // Load report tables
    this.loadReportTables();
  }

  /**
   * Load report tables with sample data
   */
  loadReportTables() {
    // This is a placeholder with sample data
    // In a real app, this would fetch actual data from the API

    // Top businesses table
    const topBusinessesTable = document.getElementById("top-businesses-table");
    if (topBusinessesTable) {
      topBusinessesTable.innerHTML = `
                <tr>
                    <td>Green Garden Cafe</td>
                    <td>42</td>
                    <td>115</td>
                    <td>$2,345.50</td>
                </tr>
                <tr>
                    <td>Fresh Bakery</td>
                    <td>38</td>
                    <td>95</td>
                    <td>$1,876.25</td>
                </tr>
                <tr>
                    <td>Sunny Grocery</td>
                    <td>31</td>
                    <td>82</td>
                    <td>$1,540.75</td>
                </tr>
            `;
    }

    // Popular categories table
    const popularCategoriesTable = document.getElementById(
      "popular-categories-table"
    );
    if (popularCategoriesTable) {
      popularCategoriesTable.innerHTML = `
                <tr>
                    <td>Bakery</td>
                    <td>112</td>
                    <td>38%</td>
                </tr>
                <tr>
                    <td>Prepared Meals</td>
                    <td>95</td>
                    <td>32%</td>
                </tr>
                <tr>
                    <td>Produce</td>
                    <td>65</td>
                    <td>22%</td>
                </tr>
                <tr>
                    <td>Dairy</td>
                    <td>24</td>
                    <td>8%</td>
                </tr>
            `;
    }
  }

  /**
   * Load settings tab data
   */
  loadSettingsData() {
    // Set up form submissions
    this.setupSettingsForms();
  }

  /**
   * Set up settings forms
   */
  setupSettingsForms() {
    // General settings form
    const generalSettingsForm = document.getElementById(
      "general-settings-form"
    );
    if (generalSettingsForm) {
      generalSettingsForm.addEventListener("submit", (e) => {
        e.preventDefault();
        showNotification("General settings saved successfully", "success");
      });
    }

    // Registration settings form
    const registrationSettingsForm = document.getElementById(
      "registration-settings-form"
    );
    if (registrationSettingsForm) {
      registrationSettingsForm.addEventListener("submit", (e) => {
        e.preventDefault();
        showNotification("Registration settings saved successfully", "success");
      });
    }

    // Add admin form
    const addAdminForm = document.getElementById("add-admin-form");
    if (addAdminForm) {
      addAdminForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const formData = new FormData(addAdminForm);
        const password = formData.get("password");
        const confirmPassword = formData.get("confirmPassword");

        if (password !== confirmPassword) {
          showNotification("Passwords do not match", "error");
          return;
        }

        // Register new admin
        const result = await authService.register({
          name: formData.get("fullName"),
          email: formData.get("email"),
          password: formData.get("password"),
          role: "admin",
        });

        if (result.success) {
          showNotification("Administrator added successfully", "success");
          addAdminForm.reset();

          // Reload users data
          this.loadUsersData();
        } else {
          showNotification(result.message, "error");
        }
      });
    }
  }
}

// Initialize admin service when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new AdminService();
});

export default AdminService;
