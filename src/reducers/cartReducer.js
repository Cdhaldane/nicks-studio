import { MAX_LINE_QUANTITY } from '../utils/cart';

const initialState = {
  items: [], // cart lines — see utils/cart.js
  isOpen: false, // the cart drawer
};

const clampQuantity = quantity => Math.max(1, Math.min(MAX_LINE_QUANTITY, quantity));

function cartReducer(state = initialState, action) {
  switch (action.type) {
    case 'ADD_TO_CART': {
      // Adding a variant that's already in the cart tops up its quantity.
      const line = action.payload;
      const existing = state.items.find(item => item.lineId === line.lineId);
      const items = existing
        ? state.items.map(item =>
            item.lineId === line.lineId
              ? { ...item, quantity: clampQuantity(item.quantity + line.quantity) }
              : item
          )
        : [...state.items, { ...line, quantity: clampQuantity(line.quantity) }];
      return { ...state, items, isOpen: true };
    }
    case 'REMOVE_FROM_CART':
      return {
        ...state,
        items: state.items.filter(item => item.lineId !== action.payload),
      };
    case 'SET_CART_QUANTITY': {
      const { lineId, quantity } = action.payload;
      if (quantity < 1) {
        return { ...state, items: state.items.filter(item => item.lineId !== lineId) };
      }
      return {
        ...state,
        items: state.items.map(item =>
          item.lineId === lineId ? { ...item, quantity: clampQuantity(quantity) } : item
        ),
      };
    }
    case 'CLEAR_CART':
      return {
        ...state,
        items: [],
      };
    case 'OPEN_CART':
      return { ...state, isOpen: true };
    case 'CLOSE_CART':
      return { ...state, isOpen: false };
    default:
      return state;
  }
}

export default cartReducer;
