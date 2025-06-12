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

  /**
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
/**
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

  /**
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
