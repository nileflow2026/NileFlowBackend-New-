# Premium Deal Backend Controller Documentation

## Overview

This document outlines the backend controller implementation for the `/api/products/premium-deal` route. Unlike the Featured Products system which creates separate documents in a dedicated collection, Premium Deals work by updating a boolean attribute (`premiumDeal`) directly on the existing product document.

## Route Information

- **Method**: `PUT`
- **Endpoint**: `/api/products/premium-deal`
- **Purpose**: Toggle the `premiumDeal` boolean attribute on a product

## Request Body

```javascript
{
  "productId": "string", // The product's $id from Appwrite
  "premiumDeal": boolean // true to mark as premium, false to remove premium status
}
```

## Controller Implementation

```javascript
const updatePremiumDeal = async (req, res) => {
  try {
    const { productId, premiumDeal } = req.body;

    // Validate required fields
    if (!productId || typeof premiumDeal !== "boolean") {
      return res.status(400).json({
        error: "productId and premiumDeal (boolean) are required.",
      });
    }

    // Verify the product exists first
    try {
      const existingProduct = await db.getDocument(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_PRODUCT_COLLECTION_ID,
        productId
      );

      // Check if the product is already in the desired state
      if (existingProduct.premiumDeal === premiumDeal) {
        const status = premiumDeal
          ? "already marked as premium"
          : "already not premium";
        return res.status(409).json({
          error: `Product is ${status}.`,
        });
      }
    } catch (error) {
      if (error.code === 404) {
        return res.status(404).json({ error: "Product not found." });
      }
      throw error; // Re-throw if it's not a 404 error
    }

    // Update the product's premiumDeal attribute
    const updatedProduct = await db.updateDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_PRODUCT_COLLECTION_ID,
      productId,
      {
        premiumDeal: premiumDeal,
      }
    );

    // Send appropriate success message
    const message = premiumDeal
      ? "Product successfully marked as premium deal!"
      : "Premium deal status removed successfully!";

    res.status(200).json({
      message: message,
      productId: productId,
      premiumDeal: premiumDeal,
    });
  } catch (error) {
    console.error("Failed to update premium deal status:", error);
    res.status(500).json({
      error: "Failed to update premium deal status.",
    });
  }
};
```

## Key Differences from Featured Products

| Aspect             | Featured Products                                       | Premium Deals                            |
| ------------------ | ------------------------------------------------------- | ---------------------------------------- |
| **Storage**        | Separate collection (`APPWRITE_FEATURED_COLLECTION_ID`) | Direct attribute on product document     |
| **Data Structure** | Creates new document with product reference             | Updates existing product's boolean field |
| **Complexity**     | More complex (duplicate data, references)               | Simpler (single field update)            |
| **Removal**        | Delete document from featured collection                | Set `premiumDeal: false`                 |

## Database Schema Requirements

### Products Collection

Ensure your Products collection has the `premiumDeal` attribute:

```javascript
// Product Document Structure
{
  $id: "unique_product_id",
  productName: "Product Name",
  price: 99.99,
  // ... other product fields
  premiumDeal: false // Boolean attribute (default: false)
}
```

## Route Registration

```javascript
// In your routes file (e.g., products.js)
router.put("/premium-deal", updatePremiumDeal);
```

## Error Handling

### Status Codes

- `200`: Success - Premium deal status updated
- `400`: Bad Request - Missing or invalid parameters
- `404`: Not Found - Product doesn't exist
- `409`: Conflict - Product already in desired state
- `500`: Internal Server Error - Database or server error

### Error Response Format

```javascript
{
  "error": "Descriptive error message"
}
```

### Success Response Format

```javascript
{
  "message": "Product successfully marked as premium deal!",
  "productId": "product_id_here",
  "premiumDeal": true
}
```

## Frontend Integration

The `PremiumDealForm` component sends requests to this endpoint with:

- **Add Premium**: `{ productId: "123", premiumDeal: true }`
- **Remove Premium**: `{ productId: "123", premiumDeal: false }`

## Testing

### Test Cases

1. **Mark as Premium (Success)**

   ```bash
   curl -X PUT /api/products/premium-deal \
   -H "Content-Type: application/json" \
   -d '{"productId": "valid_id", "premiumDeal": true}'
   ```

2. **Remove Premium Status (Success)**

   ```bash
   curl -X PUT /api/products/premium-deal \
   -H "Content-Type: application/json" \
   -d '{"productId": "valid_id", "premiumDeal": false}'
   ```

3. **Invalid Product ID (404)**

   ```bash
   curl -X PUT /api/products/premium-deal \
   -H "Content-Type: application/json" \
   -d '{"productId": "nonexistent_id", "premiumDeal": true}'
   ```

4. **Missing Parameters (400)**
   ```bash
   curl -X PUT /api/products/premium-deal \
   -H "Content-Type: application/json" \
   -d '{"productId": "valid_id"}'
   ```

## Security Considerations

1. **Authentication**: Ensure the route is protected with admin authentication middleware
2. **Validation**: Validate productId format if using specific ID patterns
3. **Rate Limiting**: Consider rate limiting to prevent abuse
4. **Logging**: Log premium deal changes for audit trails

## Example Middleware Setup

```javascript
// Protect the route with admin authentication
router.put("/premium-deal", authMiddleware, adminMiddleware, updatePremiumDeal);
```

## Environment Variables Required

```env
APPWRITE_DATABASE_ID=your_database_id
APPWRITE_PRODUCT_COLLECTION_ID=your_products_collection_id
```

## Notes

- No need for a separate Premium Deals collection
- The `premiumDeal` boolean can be used for filtering in queries
- Consider indexing the `premiumDeal` field if you frequently query premium products
- This approach is more efficient than the featured products pattern for simple boolean flags
