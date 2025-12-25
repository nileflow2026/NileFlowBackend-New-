# Backend Optimization Required

## Critical Performance Issue

The frontend was making **1 API call per product** to fetch review counts, causing severe performance degradation.

Example: If 50 products are displayed, that's **51 API calls** (1 for products + 50 for reviews).

## Required Backend Changes

### Update `/api/customerprofile/fetch-product` endpoint to include review count

**Add this to your product query:**

```javascript
// In your backend controller for fetch-product
router.get("/fetch-product", async (req, res) => {
  try {
    const { category, page = 1, limit = 20 } = req.query;

    // Your existing product query
    const products = await Product.find(categoryFilter)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    // ✅ ADD: Populate review count for each product
    const productsWithReviews = await Promise.all(
      products.map(async (product) => {
        const reviewCount = await Review.countDocuments({
          productId: product._id,
        });

        return {
          ...product.toObject(),
          reviewCount, // ✅ Add review count to product
          $id: product._id.toString(),
        };
      })
    );

    res.json({
      success: true,
      products: productsWithReviews,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

## Performance Improvement

**Before:**

- Load 50 products: 51 API calls (4-6 seconds)
- Each review fetch: ~80-100ms
- Total time: 4000-5000ms

**After:**

- Load 50 products: 1 API call (200-400ms)
- All review counts included in product data
- Total time: ~300ms

## Frontend Changes Applied

✅ Removed individual `fetchReviews()` calls  
✅ Added pagination (20 products per page)  
✅ Implemented infinite scroll with `onEndReached`  
✅ Products display immediately while ratings load in background  
✅ Loading skeleton shows during initial load  
✅ "Loading more..." indicator at bottom when loading next page

## Testing

1. Start backend server
2. Verify `/api/customerprofile/fetch-product` returns products with `reviewCount` field
3. Open app and navigate to Home screen
4. Products should load in ~300ms instead of 4-6 seconds
5. Scroll to bottom to test pagination (should load next 20 products)
