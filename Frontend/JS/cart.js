/**
 * Cart functionality for SaveBite application
 */
import apiService from "./api.js";
import authService from "./auth.js";
import {
  formatPrice,
  calculateDiscount,
  formatDate,
  showNotification,
  openModal,
  closeModal,
} from "./utils.js";

/**
 * CartService class for handling cart-related operations
 */
class CartService {
  /**
   * Initialize the cart service
   */
  constructor() {
    // Initialize cart count
    this.updateCartCount();
  }

  /**
   * Update cart count in the navigation
   */
  async updateCartCount() {
  const cartCountElements = document.querySelectorAll(".cart-count");
  if (!cartCountElements.length) return;

  try {
    const cart = await apiService.getCart();

    if (!cart || !Array.isArray(cart.items)) {
      console.warn("Cart or cart.items is undefined or not an array");
      return;
    }

    const totalItems = cart.items.reduce(
      (total, item) => total + item.quantity,
      0
    );

    cartCountElements.forEach((el) => {
      el.textContent = totalItems;
      el.style.display = totalItems > 0 ? "inline-flex" : "none";
    });
  } catch (error) {
    console.error("Error updating cart count:", error);
     cartCountElements.forEach((el) => {
      el.style.display = "none";
    });
  }
}


  /**
   * Render cart items in the cart page
   * @returns {Promise<void>}
   */
 async renderCart() {
  // Get elements
  const cartContent = document.getElementById("cart-content");
  const cartItems = document.getElementById("cart-items");
  const emptyCart = document.getElementById("empty-cart");
  const subtotalEl = document.getElementById("subtotal");
  const savingsEl = document.getElementById("savings");
  const taxEl = document.getElementById("tax");
  const totalEl = document.getElementById("total");

  if (!cartContent || !cartItems || !emptyCart) return;

  try {
    // Get cart
    const cart = await apiService.getCart();

    // ✅ SAFETY CHECK
    if (!cart || !Array.isArray(cart.items)) {
      throw new Error("Cart structure is invalid");
    }

    // Check if cart is empty
    if (cart.items.length === 0) {
      cartContent.style.display = "none";
      emptyCart.style.display = "block";
      return;
    }

    // Show cart content
    cartContent.style.display = "grid";
    emptyCart.style.display = "none";

    // Render cart items
    let cartItemsHTML = "";
    let subtotal = 0;
    let savings = 0;

    cart.items.forEach((item, index) => {
      const itemSubtotal = item.discountedPrice * item.quantity;
      const itemSavings = (item.originalPrice - item.discountedPrice) * item.quantity;

      subtotal += itemSubtotal;
      savings += itemSavings;

      cartItemsHTML += `
        <div class="cart-item" data-id="${item.listingId}" style="animation-delay: ${index * 0.1}s">
          <div class="cart-item-image">
            <img src="${item.imageUrl}" alt="${item.name}">
          </div>
          <div class="cart-item-details">
            <h3 class="cart-item-title">${item.name}</h3>
            <p class="cart-item-business">${item.businessName}</p>
            <div class="cart-item-price">
              <span class="cart-original-price">${formatPrice(item.originalPrice)}</span>
              <span class="cart-discounted-price">${formatPrice(item.discountedPrice)}</span>
              <span class="discount-badge">-${calculateDiscount(item.originalPrice, item.discountedPrice)}%</span>
            </div>
            <div class="cart-item-actions">
              <div class="cart-quantity">
                <button class="cart-quantity-btn minus" data-id="${item.listingId}">
                  <i class="fas fa-minus"></i>
                </button>
                <span class="cart-quantity-value">${item.quantity}</span>
                <button class="cart-quantity-btn plus" data-id="${item.listingId}">
                  <i class="fas fa-plus"></i>
                </button>
              </div>
              <button class="cart-remove" data-id="${item.listingId}">
                <i class="fas fa-trash-alt"></i> Remove
              </button>
            </div>
          </div>
        </div>
      `;
    });

    const tax = subtotal * 0.08;
    const total = subtotal + tax;

    // Update HTML
    cartItems.innerHTML = cartItemsHTML;
    if (subtotalEl) subtotalEl.textContent = formatPrice(subtotal);
    if (savingsEl) savingsEl.textContent = formatPrice(savings);
    if (taxEl) taxEl.textContent = formatPrice(tax);
    if (totalEl) totalEl.textContent = formatPrice(total);

    this.addCartEventListeners();
  } catch (error) {
    console.error("Error rendering cart:", error);
    cartItems.innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-circle"></i>
        <h3>Error loading cart</h3>
        <p>Please try again later</p>
      </div>
    `;
  }
}


  /**
   * Add event listeners to cart elements
   */
  addCartEventListeners() {
    // Quantity buttons
    const minusButtons = document.querySelectorAll(".cart-quantity-btn.minus");
    const plusButtons = document.querySelectorAll(".cart-quantity-btn.plus");
    const removeButtons = document.querySelectorAll(".cart-remove");

    // Minus buttons
    minusButtons.forEach((button) => {
      button.addEventListener("click", async () => {
        const itemId = button.getAttribute("data-id");
        const quantityEl = button.nextElementSibling;
        const currentQuantity = parseInt(quantityEl.textContent);

        if (currentQuantity > 1) {
          // Update quantity
          await apiService.updateCartItemQuantity(itemId, currentQuantity - 1);

          // Update cart display
          this.renderCart();
          this.updateCartCount();
        } else {
          // Remove item if quantity is 1
          await apiService.removeFromCart(itemId);

          // Update cart display
          this.renderCart();
          this.updateCartCount();
        }
      });
    });

    // Plus buttons
    plusButtons.forEach((button) => {
      button.addEventListener("click", async () => {
        const itemId = button.getAttribute("data-id");
        const quantityEl = button.previousElementSibling;
        const currentQuantity = parseInt(quantityEl.textContent);

        // Update quantity
        await apiService.updateCartItemQuantity(itemId, currentQuantity + 1);

        // Update cart display
        this.renderCart();
        this.updateCartCount();
      });
    });

    // Remove buttons
    removeButtons.forEach((button) => {
      button.addEventListener("click", async () => {
        const itemId = button.getAttribute("data-id");

        // Remove item
        await apiService.removeFromCart(itemId);

        // Update cart display
        this.renderCart();
        this.updateCartCount();

        showNotification("Item removed from cart", "info");
      });
    });

    // Checkout button
    const checkoutBtn = document.getElementById("checkout-btn");
    if (checkoutBtn) {
      checkoutBtn.addEventListener("click", () => {
        this.showCheckoutModal();
      });
    }

    // Continue shopping button
    const continueShoppingBtn = document.getElementById("continue-shopping");
    if (continueShoppingBtn) {
      continueShoppingBtn.addEventListener("click", () => {
        window.location.href = "listings.html";
      });
    }
  }

  /**
   * Show checkout modal
   */
  async showCheckoutModal() {
    const modal = document.getElementById("checkout-modal");
    const pickupOptionsContainer = document.getElementById("pickup-options");
    const orderSummaryContainer = document.getElementById("order-summary");

    if (!modal || !pickupOptionsContainer || !orderSummaryContainer) {
      console.error("Checkout modal elements not found");
      return;
    }

    try {
      // Get cart
      const cart = await apiService.getCart();

      if (!cart.items.length) {
        showNotification("Your cart is empty", "error");
        return;
      }

      // Get current user
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        showNotification("Please log in to checkout", "error");
        setTimeout(() => {
          window.location.href = "login.html";
        }, 1500);
        return;
      }

      // Populate pickup options
      const pickupLocations = {};

      // Group items by business/pickup location
      cart.items.forEach((item) => {
        if (!pickupLocations[item.businessId]) {
          pickupLocations[item.businessId] = {
            businessId: item.businessId,
            businessName: item.businessName,
            pickupAddress: item.pickupAddress,
            items: [],
          };
        }

        pickupLocations[item.businessId].items.push(item);
      });

      // Create pickup options HTML
      let pickupOptionsHTML = "";

      Object.values(pickupLocations).forEach((location, index) => {
        pickupOptionsHTML += `
                    <div class="pickup-option ${
                      index === 0 ? "selected" : ""
                    }" data-business-id="${location.businessId}">
                        <div class="pickup-option-header">
                            <span class="pickup-option-name">${
                              location.businessName
                            }</span>
                            <span class="pickup-option-items">${
                              location.items.length
                            } item${location.items.length > 1 ? "s" : ""}</span>
                        </div>
                        <p class="pickup-option-address">${
                          location.pickupAddress
                        }</p>
                    </div>
                `;
      });

      pickupOptionsContainer.innerHTML = pickupOptionsHTML;

      // Calculate order summary
      let subtotal = 0;
      let savings = 0;

      cart.items.forEach((item) => {
        subtotal += item.discountedPrice * item.quantity;
        savings += (item.originalPrice - item.discountedPrice) * item.quantity;
      });

      const tax = subtotal * 0.08; // Assuming 8% tax
      const total = subtotal + tax;

      // Create order summary HTML
      const orderSummaryHTML = `
                <div class="order-summary-item">
                    <span>Subtotal</span>
                    <span>${formatPrice(subtotal)}</span>
                </div>
                <div class="order-summary-item">
                    <span>You save</span>
                    <span>${formatPrice(savings)}</span>
                </div>
                <div class="order-summary-item">
                    <span>Estimated Tax</span>
                    <span>${formatPrice(tax)}</span>
                </div>
                <div class="order-summary-item total">
                    <span>Total</span>
                    <span>${formatPrice(total)}</span>
                </div>
            `;

      orderSummaryContainer.innerHTML = orderSummaryHTML;

      // Set default pickup time (1 hour from now)
      const pickupTimeInput = document.getElementById("pickup-time");
      if (pickupTimeInput) {
        const defaultTime = new Date();
        defaultTime.setHours(defaultTime.getHours() + 1);
        defaultTime.setMinutes(
          defaultTime.getMinutes() - defaultTime.getTimezoneOffset()
        );
        pickupTimeInput.value = defaultTime.toISOString().slice(0, 16);
        pickupTimeInput.min = new Date().toISOString().slice(0, 16);
      }

      // Pre-fill user information
      const nameInput = document.getElementById("checkout-name");
      const emailInput = document.getElementById("checkout-email");
      if (nameInput && emailInput && currentUser) {
        nameInput.value = currentUser.name;
        emailInput.value = currentUser.email;
      }

      // Show modal
      openModal(modal);

      // Add event listeners to pickup options
      const pickupOptions = document.querySelectorAll(".pickup-option");
      pickupOptions.forEach((option) => {
        option.addEventListener("click", () => {
          // Remove selected class from all options
          pickupOptions.forEach((opt) => opt.classList.remove("selected"));

          // Add selected class to clicked option
          option.classList.add("selected");
        });
      });
    } catch (error) {
      console.error("Error showing checkout modal:", error);
      showNotification("Error processing checkout", "error");
    }
  }

  /**
   * Handle checkout form submission
   * @param {HTMLFormElement} form - Checkout form element
   */
  async submitCheckoutForm(form) {
    try {
      // Get form data
      const formData = new FormData(form);

      // Get selected pickup option
      const selectedPickupOption = document.querySelector(
        ".pickup-option.selected"
      );
      if (!selectedPickupOption) {
        showNotification("Please select a pickup location", "error");
        return;
      }

      // Create order data
      const orderData = {
        customerName: formData.get("name"),
        customerEmail: formData.get("email"),
        customerPhone: formData.get("phone"),
        pickupTime: new Date(formData.get("pickupTime")).toISOString(),
        notes: formData.get("notes") || "",
        pickupLocationId: selectedPickupOption.getAttribute("data-business-id"),
        pickupLocationName: selectedPickupOption.querySelector(
          ".pickup-option-name"
        ).textContent,
        pickupAddress: selectedPickupOption.querySelector(
          ".pickup-option-address"
        ).textContent,
      };

      // Validate required fields
      if (
        !orderData.customerName ||
        !orderData.customerEmail ||
        !orderData.customerPhone ||
        !orderData.pickupTime
      ) {
        showNotification("Please fill in all required fields", "error");
        return;
      }

      // Validate pickup time
      const pickupTime = new Date(orderData.pickupTime);
      const now = new Date();
      if (pickupTime <= now) {
        showNotification("Pickup time must be in the future", "error");
        return;
      }

      // Create order
      const result = await apiService.createOrder(orderData);

      if (result.success) {
        // Close checkout modal
        closeModal(document.getElementById("checkout-modal"));

        // Show confirmation modal
        this.showOrderConfirmation(result.order);

        // Update cart count
        this.updateCartCount();

        return true;
      } else {
        showNotification(result.message || "Error placing order", "error");
        return false;
      }
    } catch (error) {
      console.error("Error submitting checkout form:", error);
      showNotification("Error processing your order", "error");
      return false;
    }
  }

  /**
   * Show order confirmation modal
   * @param {Object} order - Order object
   */
  showOrderConfirmation(order) {
    const modal = document.getElementById("confirmation-modal");
    if (!modal) return;

    // Set order details
    const orderIdEl = document.getElementById("order-id");
    const pickupLocationEl = document.getElementById("pickup-location");
    const pickupTimeEl = document.getElementById("confirmation-pickup-time");

    if (orderIdEl)
      orderIdEl.textContent = order.id.substring(0, 8).toUpperCase();
    if (pickupLocationEl)
      pickupLocationEl.textContent = `${order.pickupLocationName} (${order.pickupAddress})`;
    if (pickupTimeEl)
      pickupTimeEl.textContent = formatDate(order.pickupTime, true);

    // Show modal
    openModal(modal);

    // Update cart display after order
    this.renderCart();
  }
}

// Create cart service instance
const cartService = new CartService();

// Initialize cart page if on that page
document.addEventListener("DOMContentLoaded", () => {
  const cartContainer = document.getElementById("cart-content");
  if (cartContainer) {
    // Render cart
    cartService.renderCart();
  }

  // Set up checkout form
  const checkoutForm = document.getElementById("checkout-form");
  if (checkoutForm) {
    checkoutForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      await cartService.submitCheckoutForm(checkoutForm);
    });
  }
    // Close checkout modal when clicking "×"
  const closeBtn = document.getElementById("checkout-close");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      const modal = document.getElementById("checkout-modal");
      closeModal(modal);
    });
  }

});

export default cartService;
