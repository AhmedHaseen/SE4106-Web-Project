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

  /**
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