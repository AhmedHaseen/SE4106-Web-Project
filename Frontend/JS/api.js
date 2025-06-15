// All fetch calls to the backend live here.

const API_BASE = "http://localhost:5000/api"; 

/*
   AUTHENTICATION ENDPOINTS
 */

/**
    Registers a new user (customer or business).
    POST /api/auth/register
 * @param {Object} payload - { name, email, password, role, businessName?, businessType? }
 * @returns {Object} { success, token, user } or { success: false, message }
 */
export async function registerUser(payload) {
  try {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("[API] registerUser error:", error);
    return { success: false, message: "Network error" };
  }
}

/*
 Logs in an existing user.
 */
export async function loginUser(payload) {
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("[API] loginUser error:", error);
    return { success: false, message: "Network error" };
  }
}

/**
 Fetches the currently logged-in user using the JWT in Authorization header.
 */
export async function fetchCurrentUser(token) {
  try {
    const response = await fetch(`${API_BASE}/auth/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("[API] fetchCurrentUser error:", error);
    return { success: false, message: "Network error" };
  }
}

/*
  LISTINGS ENDPOINTS
 */

/*
  listings array or empty array on failure
 */
export async function getListings(filters = {}) {
  try {
    const params = new URLSearchParams();
    if (filters.search) params.append("search", filters.search);
    if (filters.category) params.append("category", filters.category);
    if (filters.sortBy) params.append("sortBy", filters.sortBy);
    if (filters.businessId) params.append("businessId", filters.businessId);

    const res = await fetch(`${API_BASE}/listings?${params.toString()}`);
    const data = await res.json();
    if (data.success) {
      return data.listings;
    } else {
      console.error("[API] getListings failed:", data.message);
      return [];
    }
  } catch (err) {
    console.error("[API] getListings error:", err);
    return [];
  }
}

/*
 listing object or null on failure
 */
export async function getListingById(id) {
  try {
    const res = await fetch(`${API_BASE}/listings/${id}`);
    const data = await res.json();
    if (data.success) {
      return data.listing;
    } else {
      console.error("[API] getListingById failed:", data.message);
      return null;
    }
  } catch (err) {
    console.error("[API] getListingById error:", err);
    return null;
  }
}

/*
 new listing payload
 */
export async function createListing(listingData) {
  try {
    const token = localStorage.getItem("token") || "";
    const res = await fetch(`${API_BASE}/listings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(listingData),
    });
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("[API] createListing error:", err);
    return { success: false, message: "Network error" };
  }
}

/*
 updated listing payload
 */
export async function updateListing(id, listingData) {
  try {
    const token = localStorage.getItem("token") || "";
    const res = await fetch(`${API_BASE}/listings/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(listingData),
    });
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("[API] updateListing error:", err);
    return { success: false, message: "Network error" };
  }
}

/*
 deleteListing Function
 */
export async function deleteListing(id) {
  try {
    const token = localStorage.getItem("token") || "";
    const res = await fetch(`${API_BASE}/listings/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("[API] deleteListing error:", err);
    return { success: false, message: "Network error" };
  }
}

/*
 CART ENDPOINTS
 */

// addToCart Function
export async function addToCart(cartItem) {
  try {
    console.log("[DEBUG] Sending cart item to backend:", cartItem); // Optional debug

    const token = localStorage.getItem("token") || "";
    const res = await fetch(`${API_BASE}/cart`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(cartItem),
    });

    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const rawText = await res.text();
      console.error("[API] Unexpected non-JSON response:", rawText);
      return { success: false, message: "Invalid server response" };
    }

    const data = await res.json();

    if (!res.ok) {
      console.error("[API] addToCart failed:", data.message || data);
      return { success: false, message: data.message || "Add to cart failed" };
    }

    return data;
  } catch (err) {
    console.error("[API] addToCart error:", err);
    return { success: false, message: "Network error" };
  }
}


/*
    getStats Function
 */
export async function getStats(role = "business") {
  try {
    const token = localStorage.getItem("token") || "";
    const res = await fetch(`${API_BASE}/stats?role=${role}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("[API] getStats error:", err);
    return { success: false, message: "Network error" };
  }
}
export async function updateOrderStatus(orderId, status) {
  try {
    const token = localStorage.getItem("token") || "";
    const res = await fetch(`${API_BASE}/orders/${orderId}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("[API] updateOrderStatus error:", err);
    return { success: false, message: "Network error" };
  }
}
export async function getOrders({ businessId, status = "all" }) {
  try {
    const token = localStorage.getItem("token") || "";
    const params = new URLSearchParams({ businessId, status });
    const res = await fetch(`${API_BASE}/orders?${params}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();
    return data.orders || [];
  } catch (err) {
    console.error("[API] getOrders error:", err);
    return [];
  }
}
/*
  getCart Function
 */
export async function getCart() {
  try {
    const token = localStorage.getItem("token") || "";
    const res = await fetch(`${API_BASE}/cart`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    console.log("[DEBUG] Cart API response:", data);

    if (data.success && data.cart) {
      return data.cart;
    } else {
      console.error("[API] getCart failed:", data.message);
      return { items: [] }; // Still safe
    }
  } catch (err) {
    console.error("[API] getCart error:", err);
    return { items: [] };
  }
}



export async function updateUserProfile(userId, data) {
  try {
    const token = localStorage.getItem("token") || "";
    const res = await fetch(`${API_BASE}/users/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    return result;
  } catch (error) {
    console.error("[API] updateUserProfile error:", error);
    return { success: false, message: "Network error" };
  }
}
/*
 updateCartItemQuantity FUnction
 */
export async function updateCartItemQuantity(listingId, quantity) {
  try {
    const token = localStorage.getItem("token") || "";
    const res = await fetch(`${API_BASE}/cart/${listingId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ quantity }),
    });

    const data = await res.json();
    return data;
  } catch (err) {
    console.error("[API] updateCartItemQuantity error:", err);
    return { success: false, message: "Network error" };
  }
}

/*
 DELETE /api/cart/:listingId
 */
export async function removeFromCart(listingId) {
  try {
    const token = localStorage.getItem("token") || "";
    const res = await fetch(`${API_BASE}/cart/${listingId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    return data;
  } catch (err) {
    console.error("[API] removeFromCart error:", err);
    return { success: false, message: "Network error" };
  }
}
export async function createOrder(orderData) {
  try {
    const token = localStorage.getItem("token") || "";
    const res = await fetch(`${API_BASE}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(orderData),
    });

    const data = await res.json();

    console.log("[DEBUG] Order API response:", data);

    return data;
  } catch (err) {
    console.error("[API] createOrder error:", err);
    return { success: false, message: "Network error" };
  }
}







/*
 Exporting everything as a single object.
 */
export default {
  registerUser,
  loginUser,
  fetchCurrentUser,
  getListings,
  getListingById,
  createListing,
  updateListing,
  deleteListing,
  addToCart,
  getStats,
  updateOrderStatus,
  getOrders,
  getCart,
  updateCartItemQuantity,
  removeFromCart, 
  createOrder,
    
};
