const initialState = {
  items: [], // { id, title, price, quantity, selectedVariant }
};

function cartReducer(state = initialState, action) {
  switch (action.type) {
    case 'ADD_TO_CART':
      return {
        ...state,
        items: [...state.items, action.payload],
      };
    case 'REMOVE_FROM_CART':
      return {
        ...state,
        items: state.items.filter(item => {
          const parsedItem = JSON.parse(item);
          return parsedItem.id !== action.payload;
        }),
      };
    case 'UPDATE_CART':
      return {
        ...state,
        items: action.payload,
      };
    case 'CLEAR_CART':
      return {
        ...state,
        items: [],
      };
    default:
      return state;
  }
}

export default cartReducer;
