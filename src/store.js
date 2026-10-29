import { configureStore } from "@reduxjs/toolkit";
import rootReducer from "./reducers";
import { isCartLine } from "./utils/cart";

// The cart survives reloads. The key is versioned so an old-format cart is
// simply ignored rather than crashing the drawer.
const CART_KEY = "nm-cart-v1";

const loadCart = () => {
  try {
    const stored = JSON.parse(window.localStorage.getItem(CART_KEY));
    return Array.isArray(stored) ? stored.filter(isCartLine) : [];
  } catch {
    return [];
  }
};

const store = configureStore({
  reducer: rootReducer,
  preloadedState: { cart: { items: loadCart(), isOpen: false } },
});

let savedItems = store.getState().cart.items;
store.subscribe(() => {
  const { items } = store.getState().cart;
  if (items === savedItems) return;
  savedItems = items;
  try {
    window.localStorage.setItem(CART_KEY, JSON.stringify(items));
  } catch {
    // Private browsing or full storage — the cart just won't persist.
  }
});

export default store;
