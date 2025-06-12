// /SaveBite-frontend/js/listing.js

import apiService from "./api.js";
import authService from "./auth.js";
import {
  formatDate,
  formatPrice,
  calculateDiscount,
  isExpired,
  formatTimeUntilExpiry,
  showNotification,
  openModal,
} from "./utils.js";

/**
 * ListingService class for handling listing-related operations
 */
class ListingService {
  constructor() {
    this.currentFilters = {
      category: "all",
      sortBy: "expiry",
      search: "",
    };
  }

  /*
   * Render listings in a container
   * @param {HTMLElement} container - Container to render listings in
   * @param {Object} options - Options for rendering
   */
  async renderListings(container, options = {}) {
    if (!container) return;

    // Show loading spinner
    container.innerHTML = `
      <div class="loading-spinner">
        <i class="fas fa-spinner fa-spin"></i>
      </div>
    `;

    // Merge options with defaults
    const defaultOptions = {
      filters: this.currentFilters,
      limit: 0,
      showAddToCart: true,
      businessId: null,
    };
    const mergedOptions = { ...defaultOptions, ...options };

    try {
      // Fetch from real API
      const listings = await apiService.getListings(mergedOptions.filters);

      // Handle no results
      if (!listings || listings.length === 0) {
        const noResults = document.getElementById("no-results");
        if (noResults) {
          noResults.style.display = "block";
        } else {
          container.innerHTML = `
            <div class="no-results">
              <i class="fas fa-search"></i>
              <h3>No listings found</h3>
              <p>Try adjusting your search or filters</p>
            </div>
          `;
        }
        return;
      }

      // Hide no-results if it exists
      const noResults = document.getElementById("no-results");
      if (noResults) noResults.style.display = "none";

      // Build HTML
      let listingsHTML = "";
      listings.forEach((listing, index) => {
        // Skip inactive (unless showAll is true)
        if (listing.status !== "active" && !options.showAll) {
          return;
        }

        const discountPercentage = calculateDiscount(
          listing.originalPrice,
          listing.discountedPrice
        );
        const expired = isExpired(listing.expiryDate);

        listingsHTML += `
          <div class="listing-card" data-id="${listing._id}" style="animation-delay: ${index * 0.1}s">
            <div class="listing-image">
              <img src="${listing.imageUrl}" alt="${listing.foodName}">
            </div>
            <div class="listing-content">
              <h3 class="listing-title">${listing.foodName}</h3>
              <p class="listing-business">
                <i class="fas fa-store"></i> ${listing.businessName}
              </p>
              <div class="listing-details">
                <span class="listing-expiry">
                  <i class="fas fa-clock"></i> ${
                    expired
                      ? "Expired"
                      : formatTimeUntilExpiry(listing.expiryDate)
                  }
                </span>
                <span class="listing-quantity">
                  <i class="fas fa-cubes"></i> ${listing.quantity} left
                </span>
              </div>
              <div class="listing-price">
                <div class="price-discount">
                  <span class="original-price">${formatPrice(
                    listing.originalPrice
                  )}</span>
                  <span class="discounted-price">${formatPrice(
                    listing.discountedPrice
                  )}</span>
                </div>
                <span class="discount-badge">-${discountPercentage}%</span>
              </div>
              <div class="listing-action">
                ${
                  mergedOptions.showAddToCart && !expired
                    ? `<button class="btn btn-primary btn-block add-to-cart-btn" data-id="${listing._id}">
                          <i class="fas fa-cart-plus"></i> Add to Cart
                        </button>`
                    : `<button class="btn btn-secondary btn-block view-listing-btn" data-id="${listing._id}">
                          View Details
                        </button>`
                }
              </div>
            </div>
          </div>
        `;
      });

      container.innerHTML = listingsHTML;
      this.addEventListeners(container, mergedOptions.showAddToCart);
    } catch (error) {
      console.error("Error rendering listings:", error);
      container.innerHTML = `
        <div class="error-message">
          <i class="fas fa-exclamation-circle"></i>
          <h3>Error loading listings</h3>
          <p>Please try again later</p>
        </div>
      `;
    }
  }

  /*
   * Add event listeners to listing elements
   * @param {HTMLElement} container - Container with listing elements
   * @param {boolean} showAddToCart - Whether add-to-cart buttons are present
   */
  addEventListeners(container, showAddToCart = true) {
    // “Add to Cart” buttons
    if (showAddToCart) {
      const addToCartButtons = container.querySelectorAll(".add-to-cart-btn");
      addToCartButtons.forEach((button) => {
        button.addEventListener("click", async (e) => {
          e.stopPropagation(); // Don’t open detail modal
          const listingId = button.getAttribute("data-id");
          await this.addToCart(listingId);
        });
      });
    }

    // Clicking the card itself shows detail
    const listingCards = container.querySelectorAll(".listing-card");
    listingCards.forEach((card) => {
      card.addEventListener("click", () => {
        const listingId = card.getAttribute("data-id");
        this.showListingDetail(listingId);
      });
    });

    // “View Details” button (if listing expired)
    const viewButtons = container.querySelectorAll(".view-listing-btn");
    viewButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        e.stopPropagation();
        const listingId = button.getAttribute("data-id");
        this.showListingDetail(listingId);
      });
    });
  }
/*
   * Show listing detail in a modal
   * @param {string} listingId - ID of listing to show
   */
  async showListingDetail(listingId) {
    const modal = document.getElementById("listing-modal");
    const detailContainer = document.getElementById("listing-detail");
    if (!modal || !detailContainer) {
      console.error("Listing modal or detail container not found");
      return;
    }

    // Loading spinner
    detailContainer.innerHTML = `
      <div class="loading-spinner">
        <i class="fas fa-spinner fa-spin"></i>
      </div>
    `;
    openModal(modal);

    try {
      const listing = await apiService.getListingById(listingId);
      if (!listing) {
        detailContainer.innerHTML = `
          <div class="error-message">
            <i class="fas fa-exclamation-circle"></i>
            <h3>Listing not found</h3>
            <p>The listing you're looking for may have been removed</p>
          </div>
        `;
        return;
      }

      const discountPercentage = calculateDiscount(
        listing.originalPrice,
        listing.discountedPrice
      );
      const expired = isExpired(listing.expiryDate);
      const currentUser = authService.getCurrentUser();
      const isCustomer = currentUser && currentUser.role === "customer";

      detailContainer.innerHTML = `
        <div class="listing-detail-image">
          <img src="${listing.imageUrl}" alt="${listing.foodName}">
        </div>
        <div class="listing-detail-content">
          <h2 class="listing-detail-title">${listing.foodName}</h2>
          <p class="listing-detail-business">
            <i class="fas fa-store"></i> ${listing.businessName}
          </p>
          <p class="listing-detail-description">${
            listing.description || ""
          }</p>
          <div class="listing-detail-info">
            <div class="detail-info-item">
              <span><i class="fas fa-calendar-alt"></i> Expires</span>
              <span>${formatDate(listing.expiryDate, true)}</span>
            </div>
            <div class="detail-info-item">
              <span><i class="fas fa-cubes"></i> Available</span>
              <span>${listing.quantity} items</span>
            </div>
            <div class="detail-info-item">
              <span><i class="fas fa-tag"></i> Category</span>
              <span>${this.formatCategory(listing.category)}</span>
            </div>
          </div>
          <div class="listing-detail-price">
            <div class="price-group">
              <span class="original-price">${formatPrice(
                listing.originalPrice
              )}</span>
              <span class="discounted-price">${formatPrice(
                listing.discountedPrice
              )}</span>
            </div>
            <span class="listing-detail-discount">-${discountPercentage}% OFF</span>
          </div>
          ${
            // If customer and not expired, show quantity selector + Add to Cart
            isCustomer && !expired
              ? `
            <div class="quantity-selector">
              <label for="item-quantity">Quantity:</label>
              <div class="quantity-controls">
                <button type="button" class="quantity-btn minus" id="quantity-minus">-</button>
                <input type="number" class="quantity-input" id="item-quantity" value="1" min="1" max="${listing.quantity}">
                <button type="button" class="quantity-btn plus" id="quantity-plus">+</button>
              </div>
            </div>
            <div class="listing-detail-actions">
              <button class="btn btn-primary" id="detail-add-to-cart" data-id="${listing._id}">
                <i class="fas fa-cart-plus"></i> Add to Cart
              </button>
              <button class="btn btn-secondary" id="detail-view-more">
                View More Items
              </button>
            </div>
          `
              : expired
              ? `
            <div class="listing-detail-actions">
              <button class="btn btn-secondary" disabled>
                <i class="fas fa-clock"></i> Expired
              </button>
              <button class="btn btn-primary" id="detail-view-more">
                View More Items
              </button>
            </div>
          `
              : `
            <div class="listing-detail-actions">
              <button class="btn btn-secondary" id="detail-view-more">
                View More Items
              </button>
            </div>
          `
          }
          <div class="pickup-location">
            <h4><i class="fas fa-map-marker-alt"></i> Pickup Location</h4>
            <p>${listing.pickupAddress}</p>
            <p>${
              listing.pickupOnly
                ? "Pickup only"
                : "Pickup or delivery available"
            }</p>
          </div>
        </div>
      `;

      // If customer & not expired, wire up quantity + add-to-cart
      if (isCustomer && !expired) {
        const quantityInput = document.getElementById("item-quantity");
        const minusBtn = document.getElementById("quantity-minus");
        const plusBtn = document.getElementById("quantity-plus");

        if (quantityInput && minusBtn && plusBtn) {
          minusBtn.addEventListener("click", () => {
            const currentVal = parseInt(quantityInput.value);
            if (currentVal > 1) {
              quantityInput.value = currentVal - 1;
            }
          });
          plusBtn.addEventListener("click", () => {
            const currentVal = parseInt(quantityInput.value);
            if (currentVal < listing.quantity) {
              quantityInput.value = currentVal + 1;
            }
          });
          quantityInput.addEventListener("change", () => {
            let value = parseInt(quantityInput.value);
            if (isNaN(value) || value < 1) {
              value = 1;
            } else if (value > listing.quantity) {
              value = listing.quantity;
            }
            quantityInput.value = value;
          });
        }

        const addToCartBtn = document.getElementById("detail-add-to-cart");
        if (addToCartBtn) {
          addToCartBtn.addEventListener("click", async () => {
            const quantity = parseInt(
              document.getElementById("item-quantity").value
            );
            await this.addToCart(listing._id, quantity);
            modal.querySelector(".modal-close").click();
          });
        }
      }

      const viewMoreBtn = document.getElementById("detail-view-more");
      if (viewMoreBtn) {
        viewMoreBtn.addEventListener("click", () => {
          window.location.href = "listings.html";
          modal.querySelector(".modal-close").click();
        });
      }
    } catch (error) {
      console.error("Error showing listing detail:", error);
      detailContainer.innerHTML = `
        <div class="error-message">
          <i class="fas fa-exclamation-circle"></i>
          <h3>Error loading listing details</h3>
          <p>Please try again later</p>
        </div>
      `;
    }
  }

  /*
   * Add a listing to the cart
   * @param {string} listingId - ID of listing to add
   * @param {number} quantity - Quantity to add (default: 1)
   */
  async addToCart(listingId, quantity = 1) {
  try {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      showNotification("Please log in to add items to your cart", "error");
      setTimeout(() => {
        window.location.href = "login.html";
      }, 1500);
      return;
    }
    if (currentUser.role !== "customer") {
      showNotification("Only customers can add items to cart", "error");
      return;
    }

    const listing = await apiService.getListingById(listingId);
    if (!listing) {
      showNotification("Listing not found", "error");
      return;
    }
    if (isExpired(listing.expiryDate)) {
      showNotification("This listing has expired", "error");
      return;
    }
    if (listing.quantity <= 0) {
      showNotification("This item is out of stock", "error");
      return;
    }
    if (quantity > listing.quantity) {
      quantity = listing.quantity;
      showNotification(
        `Only ${quantity} items available. Adjusted quantity.`,
        "warning"
      );
    }

    const cartItem = {
      listingId: listing._id,
      businessId: listing.businessId?._id || listing.businessId,
      businessName: listing.businessName,
      name: listing.foodName,
      originalPrice: listing.originalPrice,
      discountedPrice: listing.discountedPrice,
      quantity,
      imageUrl: listing.imageUrl,
      expiryDate: listing.expiryDate,
      pickupOnly: listing.pickupOnly,
      pickupAddress: listing.pickupAddress,
    };

    const result = await apiService.addToCart(cartItem);

    if (result.success) {
      authService.updateCartCount();
      showNotification(`${listing.foodName} added to cart`, "success");
    } else {
      showNotification(result.message || "Failed to add to cart", "error");
    }
  } catch (error) {
    console.error("Error adding to cart:", error);
    showNotification("Error adding item to cart", "error");
  }
}
/*
   * Set up filter controls for listings page
   */
  setupFilters() {
    const categoryFilter = document.getElementById("category-filter");
    const sortByFilter = document.getElementById("sort-by");
    const searchInput = document.getElementById("search-input");
    const searchBtn = document.getElementById("search-btn");
    const resetBtn = document.getElementById("filter-reset");

    if (!categoryFilter || !sortByFilter || !searchInput || !searchBtn) {
      return;
    }

    categoryFilter.addEventListener("change", () => {
      this.currentFilters.category = categoryFilter.value;
      this.applyFilters();
    });
    sortByFilter.addEventListener("change", () => {
      this.currentFilters.sortBy = sortByFilter.value;
      this.applyFilters();
    });
    searchBtn.addEventListener("click", () => {
      this.currentFilters.search = searchInput.value.trim();
      this.applyFilters();
    });
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        this.currentFilters.search = searchInput.value.trim();
        this.applyFilters();
      }
    });

    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        categoryFilter.value = "all";
        sortByFilter.value = "expiry";
        searchInput.value = "";
        this.currentFilters = { category: "all", sortBy: "expiry", search: "" };
        this.applyFilters();
      });
    }
  }

  /**
   * Apply current filters and re-render
   */
  applyFilters() {
    const listingsContainer = document.getElementById("listings-container");
    if (listingsContainer) {
      this.renderListings(listingsContainer);
    }
  }

  /*
   * Format category name for display
   * @param {string} category - Category slug
   * @returns {string} Formatted category name
   */
  formatCategory(category) {
    switch (category) {
      case "meals":
        return "Prepared Meals";
      case "bakery":
        return "Bakery";
      case "produce":
        return "Produce";
      case "dairy":
        return "Dairy";
      case "other":
        return "Other";
      default:
        return category.charAt(0).toUpperCase() + category.slice(1);
    }
  }

  /*
   * Render a listing form (add/edit)
   * @param {HTMLFormElement} form - Form element
   * @param {Object} listing - Listing data for editing (null for new listing)
   */
  renderListingForm(form, listing = null) {
    if (!form) return;

    if (listing) {
      // Editing an existing listing
      if (form.id === "edit-listing-form") {
        document.getElementById("edit-listing-id").value = listing._id;
      }
      form.elements["foodName"].value = listing.foodName;
      form.elements["category"].value = listing.category;
      form.elements["originalPrice"].value = listing.originalPrice;
      form.elements["discountedPrice"].value = listing.discountedPrice;
      form.elements["quantity"].value = listing.quantity;

      // Convert expiryDate to YYYY-MM-DDTHH:MM
      const expiryDate = new Date(listing.expiryDate);
      const formattedDate = expiryDate.toISOString().slice(0, 16);
      form.elements["expiryDate"].value = formattedDate;

      form.elements["description"].value = listing.description;
      form.elements["imageUrl"].value = listing.imageUrl;
      form.elements["pickupOnly"].checked = listing.pickupOnly;
      form.elements["pickupAddress"].value = listing.pickupAddress;
    } else {
      // New listing: reset and set defaults
      form.reset();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setMinutes(tomorrow.getMinutes() - tomorrow.getTimezoneOffset());
      form.elements["expiryDate"].value = tomorrow.toISOString().slice(0, 16);

      // Pre-fill business address if available
      const currentUser = authService.getCurrentUser();
      if (currentUser && currentUser.businessAddress) {
        form.elements["pickupAddress"].value = currentUser.businessAddress;
      }
    }
  }

  /*
   * Submit a listing form (add or edit)
   * @param {HTMLFormElement} form - Form element
   * @param {string} mode - "add" or "edit"
   */
  async submitListingForm(form, mode = "add") {
    try {
      const currentUser = authService.getCurrentUser();
      if (
        !currentUser ||
        (currentUser.role !== "business" && currentUser.role !== "admin")
      ) {
        showNotification("Only businesses can manage listings", "error");
        return false;
      }

      const formData = new FormData(form);
      const listingData = {
        foodName: formData.get("foodName"),
        category: formData.get("category"),
        originalPrice: parseFloat(formData.get("originalPrice")),
        discountedPrice: parseFloat(formData.get("discountedPrice")),
        quantity: parseInt(formData.get("quantity")),
        expiryDate: new Date(formData.get("expiryDate")).toISOString(),
        description: formData.get("description"),
        imageUrl: formData.get("imageUrl"),
        pickupOnly: formData.get("pickupOnly") === "on",
        pickupAddress: formData.get("pickupAddress"),
      };

      // Validate all required fields
      for (const [key, value] of Object.entries(listingData)) {
        if (value === "" || value === null || value === undefined) {
          showNotification(`Please fill in all required fields`, "error");
          return false;
        }
      }

      // Discount must be < original
      if (listingData.discountedPrice >= listingData.originalPrice) {
        showNotification(
          "Discounted price must be less than original price",
          "error"
        );
        return false;
      }

      // Expiry date must be in future
      const expiryDate = new Date(listingData.expiryDate);
      const now = new Date();
      if (expiryDate <= now) {
        showNotification("Expiry date must be in the future", "error");
        return false;
      }

      let result;
      if (mode === "edit") {
        const listingId = document.getElementById("edit-listing-id").value;
        result = await apiService.updateListing(listingId, listingData);
      } else {
        result = await apiService.createListing(listingData);
      }

      if (result.success) {
        showNotification(
          mode === "edit"
            ? "Listing updated successfully"
            : "Listing created successfully",
          "success"
        );
        return true;
      } else {
        showNotification(result.message || "Error saving listing", "error");
        return false;
      }
    } catch (error) {
      console.error("Error submitting listing form:", error);
      showNotification("Error saving listing", "error");
      return false;
    }
  }

  /*
   * Delete a listing
   * @param {string} listingId - ID of listing to delete
   * @returns {Promise<boolean>}
   */
  async deleteListing(listingId) {
    try {
      if (
        !confirm(
          "Are you sure you want to delete this listing? This action cannot be undone."
        )
      ) {
        return false;
      }
      const result = await apiService.deleteListing(listingId);
      if (result.success) {
        showNotification("Listing deleted successfully", "success");
        return true;
      } else {
        showNotification(result.message || "Error deleting listing", "error");
        return false;
      }
    } catch (error) {
      console.error("Error deleting listing:", error);
      showNotification("Error deleting listing", "error");
      return false;
    }
  }
/*
   * Render business listings in a dashboard table
   * @param {HTMLElement} tableBody - <tbody> element to populate
   */
  async renderBusinessListings(tableBody) {
    if (!tableBody) return;

    // Loading spinner
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center">
          <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
          </div>
        </td>
      </tr>
    `;

    try {
      const currentUser = authService.getCurrentUser();
      if (
        !currentUser ||
        (currentUser.role !== "business" && currentUser.role !== "admin")
      ) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="6" class="text-center">
              <p>Only businesses can view their listings</p>
            </td>
          </tr>
        `;
        return;
      }

      // Fetch listings belonging to this business
      const listings = await apiService.getListings({
        businessId: currentUser.id,
      });

      if (!listings || listings.length === 0) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="6" class="text-center">
              <p>No listings found. Create your first listing to get started.</p>
            </td>
          </tr>
        `;
        const noListings = document.getElementById("no-listings");
        if (noListings) {
          noListings.style.display = "block";
        }
        return;
      }

      // Hide any “no listings” container if it exists
      const noListings = document.getElementById("no-listings");
      if (noListings) {
        noListings.style.display = "none";
      }

      let tableRows = "";
      listings.forEach((listing) => {
        let statusClass = "bg-success";
        if (listing.status === "sold-out") {
          statusClass = "bg-warning";
        } else if (
          listing.status === "expired" ||
          isExpired(listing.expiryDate)
        ) {
          statusClass = "bg-error";
        }

        let statusText =
          listing.status.charAt(0).toUpperCase() + listing.status.slice(1);
        if (
          listing.status === "active" &&
          isExpired(listing.expiryDate)
        ) {
          statusText = "Expired";
        }

        const expiryText = isExpired(listing.expiryDate)
          ? "Expired"
          : formatDate(listing.expiryDate, true);

        tableRows += `
          <tr>
            <td>
              <div class="d-flex align-items-center">
                <img src="${listing.imageUrl}" alt="${listing.foodName}" width="40" height="40" style="object-fit: cover; border-radius: 4px; margin-right: 8px;">
                ${listing.foodName}
              </div>
            </td>
            <td>${formatPrice(listing.discountedPrice)} <span class="original-price">${formatPrice(listing.originalPrice)}</span></td>
            <td>${listing.quantity}</td>
            <td>${expiryText}</td>
            <td><span class="user-status ${statusClass}">${statusText}</span></td>
            <td>
              <div class="listing-actions">
                <button class="edit" data-id="${listing._id}"><i class="fas fa-edit"></i></button>
                <button class="delete" data-id="${listing._id}"><i class="fas fa-trash-alt"></i></button>
              </div>
            </td>
          </tr>
        `;
      });

      tableBody.innerHTML = tableRows;

      // Wire up the buttons
      const editButtons = tableBody.querySelectorAll(".edit");
      const deleteButtons = tableBody.querySelectorAll(".delete");

      editButtons.forEach((button) => {
        button.addEventListener("click", async () => {
          const listingId = button.getAttribute("data-id");
          this.showEditListingModal(listingId);
        });
      });
      deleteButtons.forEach((button) => {
        button.addEventListener("click", async () => {
          const listingId = button.getAttribute("data-id");
          const success = await this.deleteListing(listingId);
          if (success) {
            this.renderBusinessListings(tableBody);
          }
        });
      });
    } catch (error) {
      console.error("Error rendering business listings:", error);
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center">
            <p>Error loading listings. Please try again later.</p>
          </td>
        </tr>
      `;
    }
  }

  /*
   * Show edit listing modal
   * @param {string} listingId - ID of listing to edit
   */
  async showEditListingModal(listingId) {
    const modal = document.getElementById("edit-listing-modal");
    const form = document.getElementById("edit-listing-form");
    if (!modal || !form) {
      console.error("Edit listing modal or form not found");
      return;
    }

    try {
      const listing = await apiService.getListingById(listingId);
      if (!listing) {
        showNotification("Listing not found", "error");
        return;
      }

      this.renderListingForm(form, listing);
      openModal(modal);

      const deleteBtn = document.getElementById("delete-listing");
      if (deleteBtn) {
        deleteBtn.addEventListener("click", async () => {
          const success = await this.deleteListing(listingId);
          if (success) {
            modal.querySelector(".modal-close").click();
            const tableBody = document.getElementById("listings-table-body");
            if (tableBody) {
              this.renderBusinessListings(tableBody);
            }
          }
        });
      }
    } catch (error) {
      console.error("Error showing edit listing modal:", error);
      showNotification("Error loading listing details", "error");
    }
  }
} 

const listingService = new ListingService();

// Set up listings page if on that page
document.addEventListener("DOMContentLoaded", () => {
  // Public listings page
  const listingsContainer = document.getElementById("listings-container");
  if (listingsContainer) {
    listingService.setupFilters();
    listingService.renderListings(listingsContainer);
  }

  // Featured listings on home page (if present)
  const featuredListingsContainer = document.getElementById(
    "featured-listings-container"
  );
  if (featuredListingsContainer) {
    listingService.renderListings(featuredListingsContainer, {
      limit: 3,
      filters: { sortBy: "discount" },
    });
  }

  // Listing detail modal close behavior
  const listingModal = document.getElementById("listing-modal");
  if (listingModal) {
    const closeBtn = listingModal.querySelector(".modal-close");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        listingModal.classList.remove("show");
        document.body.style.overflow = "";
      });
    }
    listingModal.addEventListener("click", (e) => {
      if (e.target === listingModal) {
        listingModal.classList.remove("show");
        document.body.style.overflow = "";
      }
    });
  }

  // Business dashboard: render business listings table
  const listingsTableBody = document.getElementById("listings-table-body");
  if (listingsTableBody) {
    listingService.renderBusinessListings(listingsTableBody);
  }

  // Listing form (Add)
  const listingForm = document.getElementById("listing-form");
  if (listingForm) {
    listingForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const success = await listingService.submitListingForm(listingForm, "add");
      if (success) {
        listingForm.reset();
        const tb = document.getElementById("listings-table-body");
        if (tb) listingService.renderBusinessListings(tb);
        const listingsTab = document.querySelector('[data-tab="listings"]');
        if (listingsTab) listingsTab.click();
      }
    });
  }

  // Edit listing form
  const editListingForm = document.getElementById("edit-listing-form");
  if (editListingForm) {
    editListingForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const success = await listingService.submitListingForm(editListingForm, "edit");
      if (success) {
        const modal = document.getElementById("edit-listing-modal");
        if (modal) modal.querySelector(".modal-close").click();
        const tb = document.getElementById("listings-table-body");
        if (tb) listingService.renderBusinessListings(tb);
      }
    });
  }

  // “Add Listing” button in dashboard
  const addListingBtn = document.getElementById("add-listing-btn");
  if (addListingBtn) {
    addListingBtn.addEventListener("click", () => {
      const addTab = document.querySelector('[data-tab="add-listing"]');
      if (addTab) addTab.click();
    });
  }

  // “Create First Listing” (if no listings exist yet)
  const createFirstListingBtn = document.getElementById("create-first-listing");
  if (createFirstListingBtn) {
    createFirstListingBtn.addEventListener("click", () => {
      const addTab = document.querySelector('[data-tab="add-listing"]');
      if (addTab) addTab.click();
    });
  }
  const listingCancelBtn = document.getElementById("listing-cancel");
  if (listingCancelBtn) {
    listingCancelBtn.addEventListener("click", () => {
      const listingsTab = document.querySelector('[data-tab="listings"]');
      if (listingsTab) listingsTab.click();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
});

export default listingService;
