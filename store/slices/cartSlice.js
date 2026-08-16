import { createSlice } from '@reduxjs/toolkit';

// Helper function to calculate totals
const calculateTotals = (items) => {
  const subtotal = items.reduce((sum, item) => {
    const price = parseFloat(item.price) || 0;
    const quantity = parseInt(item.quantity) || 0;
    return sum + (price * quantity);
  }, 0);
  
  const totalItems = items.reduce((sum, item) => {
    const quantity = parseInt(item.quantity) || 0;
    return sum + quantity;
  }, 0);
  
  // Platform fee: ₹5 per item
  const platformFee = totalItems * 5;
  
  // Shipping calculation (can be customized)
  const shipping = subtotal > 500 ? 0 : 50;
  
  const total = subtotal + platformFee + shipping;
  
  return { subtotal, totalItems, platformFee, shipping, total };
};

const initialState = {
  items: [], // [{ productId, name, price, quantity, image, referralCode, maxStock }]
  referralCode: null, // Global referral code from URL
  subtotal: 0,
  totalItems: 0,
  platformFee: 0,
  shipping: 0,
  total: 0,
};

// Migrate function to fix old cart data
const migrateCartState = (state) => {
  if (!state || !state.items) return initialState;
  
  // Fix any items with invalid data
  const validItems = state.items.map(item => ({
    ...item,
    price: parseFloat(item.price) || 0,
    quantity: parseInt(item.quantity) || 1,
    maxStock: parseInt(item.maxStock) || parseInt(item.stock) || 0,
  })).filter(item => item.productId && item.name && item.price > 0);
  
  const totals = calculateTotals(validItems);
  
  return {
    items: validItems,
    referralCode: state.referralCode || null,
    ...totals,
  };
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const { productId, name, price, image, stock, quantity = 1, referralCode } = action.payload;
      
      console.log('[Cart Slice] Received:', { productId, name, price, image, stock, quantity, referralCode });
      
      // Ensure numeric values
      const numericPrice = parseFloat(price) || 0;
      const numericQuantity = parseInt(quantity) || 1;
      const numericStock = parseInt(stock) || 0;
      
      console.log('[Cart Slice] Converted:', { numericPrice, numericQuantity, numericStock });
      
      const existingItem = state.items.find(item => item.productId === productId);
      
      if (existingItem) {
        // Update quantity if already in cart
        const newQuantity = existingItem.quantity + numericQuantity;
        existingItem.quantity = Math.min(newQuantity, numericStock); // Don't exceed stock
      } else {
        // Add new item to cart
        const newItem = {
          productId,
          name,
          price: numericPrice,
          quantity: Math.min(numericQuantity, numericStock),
          image,
          referralCode: referralCode || state.referralCode,
          maxStock: numericStock,
        };
        console.log('[Cart Slice] Adding new item:', newItem);
        state.items.push(newItem);
      }
      
      // Recalculate totals
      const totals = calculateTotals(state.items);
      console.log('[Cart Slice] Totals:', totals);
      state.subtotal = totals.subtotal;
      state.totalItems = totals.totalItems;
      state.platformFee = totals.platformFee;
      state.shipping = totals.shipping;
      state.total = totals.total;
    },
    
    removeFromCart: (state, action) => {
      const productId = action.payload;
      state.items = state.items.filter(item => item.productId !== productId);
      
      // Recalculate totals
      const totals = calculateTotals(state.items);
      state.subtotal = totals.subtotal;
      state.totalItems = totals.totalItems;
      state.shipping = totals.shipping;
      state.total = totals.total;
    },
    
    updateQuantity: (state, action) => {
      const { productId, quantity } = action.payload;
      const item = state.items.find(item => item.productId === productId);
      
      if (item) {
        item.quantity = Math.max(1, Math.min(quantity, item.maxStock));
        
        // Recalculate totals
        const totals = calculateTotals(state.items);
        state.subtotal = totals.subtotal;
        state.totalItems = totals.totalItems;
        state.platformFee = totals.platformFee;
        state.shipping = totals.shipping;
        state.total = totals.total;
      }
    },
    
    setReferralCode: (state, action) => {
      state.referralCode = action.payload;
    },
    
    clearCart: (state) => {
      state.items = [];
      state.referralCode = null;
      state.subtotal = 0;
      state.totalItems = 0;
      state.platformFee = 0;
      state.shipping = 0;
      state.total = 0;
    },
    
    // Validate and fix cart data (for migration/corruption issues)
    validateCart: (state) => {
      console.log('[Cart Slice] Validating cart, current items:', state.items);
      
      // Fix any items with invalid data
      state.items = state.items.map(item => ({
        ...item,
        price: parseFloat(item.price) || 0,
        quantity: parseInt(item.quantity) || 1,
        maxStock: parseInt(item.maxStock) || parseInt(item.stock) || 0,
      })).filter(item => item.productId && item.name && !isNaN(item.price));
      
      // Recalculate totals
      const totals = calculateTotals(state.items);
      state.subtotal = totals.subtotal;
      state.totalItems = totals.totalItems;
      state.platformFee = totals.platformFee;
      state.shipping = totals.shipping;
      state.total = totals.total;
      
      console.log('[Cart Slice] After validation:', { items: state.items, totals });
    },
    
    // Load cart from localStorage (for guest users)
    loadCart: (state, action) => {
      const { items, referralCode } = action.payload;
      state.items = items || [];
      state.referralCode = referralCode || null;
      
      // Recalculate totals
      const totals = calculateTotals(state.items);
      state.subtotal = totals.subtotal;
      state.totalItems = totals.totalItems;
      state.platformFee = totals.platformFee;
      state.shipping = totals.shipping;
      state.total = totals.total;
    },
    
    // Merge guest cart with user cart on login
    mergeCart: (state, action) => {
      const guestItems = action.payload;
      
      if (!guestItems || guestItems.length === 0) return;
      
      guestItems.forEach(guestItem => {
        const existingItem = state.items.find(item => item.productId === guestItem.productId);
        
        if (existingItem) {
          // Sum quantities
          const newQuantity = existingItem.quantity + guestItem.quantity;
          existingItem.quantity = Math.min(newQuantity, guestItem.maxStock);
        } else {
          // Add guest item to cart
          state.items.push(guestItem);
        }
      });
      
      // Recalculate totals
      const totals = calculateTotals(state.items);
      state.subtotal = totals.subtotal;
      state.totalItems = totals.totalItems;
      state.platformFee = totals.platformFee;
      state.shipping = totals.shipping;
      state.total = totals.total;
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  setReferralCode,
  clearCart,
  validateCart,
  loadCart,
  mergeCart,
} = cartSlice.actions;

export default cartSlice.reducer;
