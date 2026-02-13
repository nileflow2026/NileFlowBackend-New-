const { Query, ID } = require("node-appwrite");
const { users, db } = require("../../services/appwriteService");
const { storage } = require("../../src/appwrite");
const { env } = require("../../src/env");
const { InputFile } = require("node-appwrite/file");

const getCustomerProfile = async (req, res) => {
  try {
    // 1️⃣ Ensure user is authenticated
    if (!req.user) {
      return res
        .status(401)
        .json({ error: "Unauthorized: No user information found." });
    }

    const { userId, email, username, role } = req.user;

    // 2️⃣ Restrict access to customers
    if (role !== "customer") {
      return res.status(403).json({ error: "Forbidden: Customers only." });
    }

    // 3️⃣ Query Appwrite database for the user profile using a safe field (e.g., accountid)
    const docs = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_USER_COLLECTION_ID,
      /* [Query.equal("accountid", userId)] */
      [Query.equal("$id", userId)],
    );

    // 4️⃣ If no document found, return empty profile (prevents frontend crashes)
    let avatarUrl = null;
    let avatarFileId = null;
    let appwriteUserId = null; // Declare a variable for the Appwrite ID
    let phone = null;
    let addresses = null;
    if (docs.total > 0) {
      const userDoc = await db.getDocument(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_USER_COLLECTION_ID,
        docs.documents[0].$id,
      );
      avatarUrl = userDoc.avatarUrl || null;
      avatarFileId = userDoc.avatarFileId || null;
      phone = userDoc.phone || null;
      addresses = userDoc.addresses || null;
      appwriteUserId = userDoc.$id; // Get the correct Appwrite ID here
    }

    // 5️⃣ Respond with user info and optional avatar
    res.status(200).json({
      user: {
        userId: appwriteUserId || userId, // Use the correct Appwrite ID or fallback
        email,
        username,
        role,
        avatarUrl,
        avatarFileId,
        phone,
        addresses,
      },
    });
  } catch (error) {
    console.error("❌ /profile error:", error);
    // 6️⃣ Generic 500 response with safe message
    res
      .status(500)
      .json({ error: "Failed to fetch user profile. Please try again later." });
  }
};

const updateCurrencyRates = async (req, res) => {
  try {
    const response = await fetch(
      "https://api.exchangerate-api.com/v4/latest/USD",
    );
    const data = await response.json();

    if (!data.rates) throw new Error("Invalid response from currency API");

    const now = new Date().toISOString();

    for (const [currencyCode, rate] of Object.entries(data.rates)) {
      // Check if currency already exists
      const existing = await db.listDocuments(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_CURRENCIES_COLLECTION,
        [Query.equal("currency_code", currencyCode)],
      );

      if (existing.total > 0) {
        // Update document
        await db.updateDocument(
          env.APPWRITE_DATABASE_ID,
          env.APPWRITE_CURRENCIES_COLLECTION,
          existing.documents[0].$id,
          {
            rate: parseFloat(rate),
            last_updated: now,
          },
        );
      } else {
        // Create new document
        await db.createDocument(
          env.APPWRITE_DATABASE_ID,
          env.APPWRITE_CURRENCIES_COLLECTION,
          ID.unique(),
          {
            currency_code: currencyCode,
            rate: parseFloat(rate),
            last_updated: now,
          },
        );
      }
    }

    console.log("✅ Currency rates updated successfully");
    return { success: true, updated: Object.keys(data.rates).length };
  } catch (err) {
    console.error("❌ Error updating currency rates:", err.message);
    return { success: false, error: err.message };
  }
};

const getCustomerOrders = async (req, res) => {
  try {
    const userId = req.user.userId; // Comes from decoded JWT via middleware

    const result = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_ORDER_COLLECTION_ID,
      [Query.equal("userId", userId), Query.orderDesc("$createdAt")],
    );

    res.status(200).json({ orders: result.documents });
  } catch (error) {
    console.error("❌ Error fetching customer orders:", error.message);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
};

const saveRecentSearch = async (req, res) => {
  const { userId, query } = req.body;

  if (!userId || !query) {
    return res.status(400).json({ message: "Missing userId or query." });
  }

  try {
    const timestamp = Math.floor(Date.now() / 1000); // seconds
    const result = await db.createDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_SEARCH_COLLECTION, // recentSearches
      ID.unique(),
      { userId, query, timestamp },
    );

    return res
      .status(201)
      .json({ message: "Recent search saved!", document: result });
  } catch (error) {
    console.error("Error saving recent search:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

const getRecentSearches = async (req, res) => {
  const { userId } = req.user;

  console.log("userId for recent search:", userId);

  if (!userId) {
    return res.status(400).json({ message: "Missing userId." });
  }

  try {
    const response = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_SEARCH_COLLECTION,
      [
        Query.equal("userId", userId),
        Query.orderDesc("timestamp"),
        Query.limit(10),
      ],
    );

    return res.status(200).json({ searches: response.documents });
  } catch (error) {
    console.error("Error fetching recent searches:", error.message);
    return res.status(500).json({ message: "Internal server error." });
  }
};

const getPopularSearches = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Get all searches and aggregate by query to find most popular
    const allSearches = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_SEARCH_COLLECTION,
      [
        Query.orderDesc("timestamp"),
        Query.limit(1000), // Get more searches to analyze
      ],
    );

    // Count query occurrences
    const queryCount = {};
    allSearches.documents.forEach((search) => {
      const query = search.query.toLowerCase().trim();
      queryCount[query] = (queryCount[query] || 0) + 1;
    });

    // Sort by count and get top results
    const popularQueries = Object.entries(queryCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, parseInt(limit))
      .map(([query, count]) => ({
        query: query,
        count: count,
        // Capitalize first letter for display
        displayQuery: query.charAt(0).toUpperCase() + query.slice(1),
      }));

    return res.status(200).json({
      searches: popularQueries,
      total: popularQueries.length,
    });
  } catch (error) {
    console.error("Error fetching popular searches:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

const clearRecentSearches = async (req, res) => {
  try {
    const { userId } = req.user;

    if (!userId) {
      return res.status(400).json({ message: "Missing userId." });
    }

    const response = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_SEARCH_COLLECTION,
      [Query.equal("userId", userId)],
    );

    const documents = response.documents;

    const deletePromises = documents.map((doc) =>
      db.deleteDocument(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_SEARCH_COLLECTION,
        doc.$id,
      ),
    );

    await Promise.all(deletePromises);

    return res
      .status(200)
      .json({ message: "Recent searches cleared successfully." });
  } catch (error) {
    console.error("Error clearing recent searches:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

const getProducts = async (req, res) => {
  try {
    const {
      category,
      search,
      minPrice,
      maxPrice,
      sort = "newest",
      inStock = true,
      vendorId,
      limit = 100,
      page = 1,
    } = req.query;

    // Base filters applied to both queries
    let baseFilters = [];

    // Category filter
    if (category && category !== "all") {
      baseFilters.push(Query.equal("categoryId", category));
    }

    // Search filter (search in multiple fields)
    if (search) {
      const normalizedSearch = search.trim().toLowerCase();
      baseFilters.push(
        Query.or([
          Query.search("productName", normalizedSearch),
          Query.search("description", normalizedSearch),
          Query.search("brand", normalizedSearch),
          Query.search("tags", normalizedSearch),
          Query.search("productName", search),
          Query.search("description", search),
          Query.search("brand", search),
          Query.search("tags", search),
        ]),
      );
    }

    // Price range
    if (minPrice) {
      baseFilters.push(Query.greaterThanEqual("price", parseFloat(minPrice)));
    }
    if (maxPrice) {
      baseFilters.push(Query.lessThanEqual("price", parseFloat(maxPrice)));
    }

    // Stock filter
    if (inStock === "true" || inStock === true) {
      baseFilters.push(Query.greaterThan("stock", 0));
    }

    // Vendor filter
    if (vendorId) {
      baseFilters.push(Query.equal("vendorId", vendorId));
    }

    console.log("Appwrite Base Filters:", baseFilters);

    // Sort options
    let sortQuery;
    switch (sort) {
      case "price-low":
        sortQuery = Query.orderAsc("price");
        break;
      case "price-high":
        sortQuery = Query.orderDesc("price");
        break;
      case "popular":
        sortQuery = Query.orderDesc("salesCount");
        break;
      case "rating":
        sortQuery = Query.orderDesc("rating");
        break;
      case "featured":
        sortQuery = Query.orderDesc("isFeatured");
        break;
      default: // "newest"
        sortQuery = Query.orderDesc("$createdAt");
    }

    // ✅ FETCH ALL PRODUCTS regardless of source or approval status
    let allProducts = [];
    let cursor = null;

    while (true) {
      const queries = [
        Query.limit(100),
        sortQuery,
        ...baseFilters,
        ...(cursor ? [Query.cursorAfter(cursor)] : []),
      ];

      const batch = await db.listDocuments(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_PRODUCT_COLLECTION_ID,
        queries,
      );

      allProducts.push(...batch.documents);

      if (batch.documents.length < 100) break;
      cursor = batch.documents[batch.documents.length - 1].$id;
    }

    const totalProducts = allProducts.length;
    const pageLimit = Math.min(parseInt(limit), 100);
    const offset = (parseInt(page) - 1) * pageLimit;

    // Apply offset for pagination
    const paginatedProducts = allProducts.slice(offset, offset + pageLimit);

    // Get unique categories for filter options
    const categories = [
      ...new Set(allProducts.map((p) => p.category).filter(Boolean)),
    ];

    res.json({
      success: true,
      products: paginatedProducts,
      total: totalProducts,
      page: parseInt(page),
      limit: pageLimit,
      totalPages: Math.ceil(totalProducts / pageLimit),
      filters: {
        category,
        search,
        minPrice,
        maxPrice,
        sort,
        inStock,
      },
      availableCategories: categories,
      stats: {
        totalProducts: totalProducts,
        outOfStock: allProducts.filter((p) => p.stock <= 0).length,
        averagePrice:
          allProducts.length > 0
            ? (
                allProducts.reduce((sum, p) => sum + (p.price || 0), 0) /
                allProducts.length
              ).toFixed(2)
            : 0,
      },
    });
  } catch (err) {
    console.error("❌ Error fetching products:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    });
  }
};

const getProductsForMobile = async (req, res) => {
  try {
    const { category, search, limit = 20, cursor } = req.query;

    let queries = [];

    // Category filter (use categoryId for consistency)
    if (category && category !== "all") {
      queries.push(Query.equal("categoryId", category));
    }

    // Search filter
    if (search) {
      queries.push(Query.search("productName", search));
    }

    // ✅ Fetch ALL products regardless of approval status
    queries.push(Query.limit(parseInt(limit)));
    queries.push(Query.orderDesc("$createdAt"));
    if (cursor) {
      queries.push(Query.cursorAfter(cursor));
    }

    const batch = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_PRODUCT_COLLECTION_ID,
      queries,
    );

    // ✅ ADD: Fetch review counts for all products in parallel
    const productsWithReviews = await Promise.all(
      batch.documents.map(async (doc) => {
        try {
          // Fetch review count and average rating
          const reviews = await db.listDocuments(
            env.APPWRITE_DATABASE_ID,
            env.APPWRITE_REVIEW_COLLECTION_ID,
            [Query.equal("productId", doc.$id), Query.select(["rating"])],
          );

          const reviewCount = reviews.total || 0;
          const avgRating =
            reviewCount > 0
              ? reviews.documents.reduce((sum, r) => sum + (r.rating || 0), 0) /
                reviewCount
              : 0;

          return {
            $id: doc.$id,
            productName: doc.productName,
            price: doc.price,
            brand: doc.brand,
            image: doc.image,
            description: doc.description,
            stock: doc.stock,
            category: doc.category,
            categoryId: doc.categoryId,
            vendorId: doc.vendorId,
            isFeatured: doc.isFeatured || false,
            // ✅ Include review data
            reviewCount,
            avgRating: parseFloat(avgRating.toFixed(1)),
            totalRatings: reviewCount,
          };
        } catch (error) {
          console.error(
            `Error fetching reviews for product ${doc.$id}:`,
            error,
          );
          // Return product without review data on error
          return {
            $id: doc.$id,
            productName: doc.productName,
            price: doc.price,
            brand: doc.brand,
            image: doc.image,
            description: doc.description,
            stock: doc.stock,
            category: doc.category,
            categoryId: doc.categoryId,
            vendorId: doc.vendorId,
            isFeatured: doc.isFeatured || false,
            reviewCount: 0,
            avgRating: 0,
            totalRatings: 0,
          };
        }
      }),
    );

    res.json({
      success: true,
      products: productsWithReviews,
      total: batch.total,
      count: productsWithReviews.length,
      nextCursor:
        batch.documents.length >= parseInt(limit)
          ? batch.documents[batch.documents.length - 1].$id
          : null,
      hasMore: batch.documents.length >= parseInt(limit),
    });
  } catch (err) {
    console.error("❌ Error fetching products:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch products" });
  }
};

const submitReview = async (req, res) => {
  try {
    const { productId, reviewText, rating, image, images } = req.body;
    console.log("Review body payload received:", req.body);

    const user = req.user; // Ensure authentication middleware attaches `req.user`

    if (!user || !user.userId) {
      return res
        .status(401)
        .json({ message: "Unauthorized. User not logged in." });
    }

    const userId = user.userId;

    // Fetch user name and avatar
    const userDoc = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_USER_COLLECTION_ID,
      [Query.equal("$id", userId)],
    );

    if (!userDoc.documents.length) {
      return res.status(404).json({ message: "User profile not found." });
    }

    const userProfile = userDoc.documents[0];
    const userName =
      userProfile.name ||
      userProfile.username ||
      userProfile.userName ||
      "Anonymous";
    const avatar =
      userProfile.avatarUrl ||
      "https://fra.cloud.appwrite.io/v1/storage/buckets/692a3b700039c02fb4bc/files/692b97e30027bf293efe/view?project=6926c7df002fa7831d94&mode=admin";
    console.log("User profile document:", userProfile);

    // Validate rating
    let validatedRating = null;
    if (rating !== null && rating !== undefined) {
      const parsedRating = parseInt(rating, 10);
      if (parsedRating >= 1 && parsedRating <= 5) {
        validatedRating = parsedRating;
      } else {
        console.warn("Invalid rating value submitted:", rating);
      }
    }

    // Handle image URLs (single or multiple)
    let imageUrl = "";
    if (images && Array.isArray(images) && images.length > 0) {
      // Multiple images - store as JSON array string
      imageUrl = JSON.stringify(images);
    } else if (image && typeof image === "string") {
      // Single image URL
      imageUrl = image;
    }

    // Create review
    const reviewPayload = {
      userId,
      productId,
      userName,
      avatar,
      reviewText: String(reviewText).trim(),
      rating: validatedRating,
      image: imageUrl,
      createdAt: new Date().toISOString(),
    };

    const review = await db.createDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_REVIEW_COLLECTION_ID,
      ID.unique(),
      reviewPayload,
    );

    // Optional: Increment product ratings count (if implemented separately)
    await incrementProductRatingsCountInternal(productId);
    return res
      .status(201)
      .json({ message: "Review submitted successfully", review });
  } catch (error) {
    console.error("Error submitting review:", error.message || error);
    return res.status(500).json({ message: "Failed to submit review." });
  }
};

const incrementProductRatingsCountInternal = async (productIdToIncrement) => {
  try {
    if (!productIdToIncrement) {
      console.warn(
        "Internal incrementProductRatingsCount called without productId",
      );
      return;
    }

    // Fetch product from the products collection
    const productResponse = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_PRODUCT_COLLECTION_ID,
      [Query.equal("$id", String(productIdToIncrement))],
    );

    if (!productResponse.documents.length) {
      console.warn(
        `Product with ID ${productIdToIncrement} not found for rating increment.`,
      );
      return;
    }

    const product = productResponse.documents[0];
    const updatedRatingsCount = (product.ratingsCount || 0) + 1;

    await db.updateDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_PRODUCT_COLLECTION_ID,
      product.$id,
      {
        ratingsCount: updatedRatingsCount,
      },
    );

    console.log(
      `Ratings count incremented for product ${productIdToIncrement}`,
    );
    return {
      message: "Ratings count incremented",
      ratingsCount: updatedRatingsCount,
    };
  } catch (error) {
    console.error(
      "Error in internal incrementProductRatingsCount:",
      error.message || error,
    );
    // Decide if you want to throw this error or just log it
  }
};

// Your original route handler for incrementing ratings (if you have one)
const incrementProductRatingsCount = async (req, res) => {
  try {
    const { productId } = req.body;
    console.log("productID from request body:", productId);

    if (!productId) {
      return res
        .status(400)
        .json({ message: "Missing productId in request body" });
    }

    const result = await incrementProductRatingsCountInternal(productId);
    if (result) {
      return res.status(200).json(result);
    } else {
      return res
        .status(500)
        .json({ message: "Failed to increment ratings count" });
    }
  } catch (error) {
    console.error(
      "Error handling incrementProductRatingsCount route:",
      error.message || error,
    );
    return res
      .status(500)
      .json({ message: "Failed to increment ratings count" });
  }
};

const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!productId) {
      console.warn("⚠️ No product ID provided");
      return res.status(400).json({ message: "Product ID is required." });
    }

    // console.log("\n🔍 === FETCHING REVIEWS FOR PRODUCT ===");
    // console.log("Product ID:", productId);

    // Fetch reviews for the product
    const reviewResponse = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_REVIEW_COLLECTION_ID,
      [
        Query.equal("productId", String(productId)),
        Query.orderDesc("createdAt"),
      ],
    );

    // console.log(`\n📝 Found ${reviewResponse.documents.length} reviews`);

    // Log first review to see what fields exist
    // if (reviewResponse.documents.length > 0) {
    //   console.log("\n📋 FIRST REVIEW DOCUMENT STRUCTURE:");
    //   console.log("Review ID:", reviewResponse.documents[0].$id);
    //   console.log("Review userName field:", reviewResponse.documents[0].userName);
    //   console.log("Review userId:", reviewResponse.documents[0].userId);
    //   console.log("All review fields:", Object.keys(reviewResponse.documents[0]));
    // }

    const uniqueUserIds = [
      ...new Set(reviewResponse.documents.map((doc) => doc.userId)),
    ];
    // console.log("\n👥 Unique user IDs to fetch:", uniqueUserIds);

    // Fetch user details in bulk
    const userDetails = {};
    await Promise.all(
      uniqueUserIds.map(async (userId) => {
        try {
          // console.log(`\n🔎 Fetching user profile for userId: ${userId}`);

          const userResponse = await db.listDocuments(
            env.APPWRITE_DATABASE_ID,
            env.APPWRITE_USER_COLLECTION_ID,
            [Query.equal("$id", userId)],
          );

          // console.log(`📊 User query results for ${userId}:`, userResponse.total, "documents found");

          if (userResponse.documents.length > 0) {
            const userDoc = userResponse.documents[0];

            // console.log(`\n✅ USER DOCUMENT FOUND for ${userId}:`);
            // console.log("User $id:", userDoc.$id);
            // console.log("User userName field:", userDoc.userName);
            // console.log("User username field:", userDoc.username);
            // console.log("User name field:", userDoc.name);
            // console.log("User email:", userDoc.email);
            // console.log("All user fields:", Object.keys(userDoc));

            const resolvedUserName =
              userDoc.userName ||
              userDoc.username ||
              userDoc.name ||
              "Anonymous";
            // console.log(`🎯 Resolved userName: "${resolvedUserName}"`);

            userDetails[userId] = {
              userName: resolvedUserName,
              avatar:
                userDoc.avatar ||
                userDoc.avatarUrl ||
                "https://fra.cloud.appwrite.io/v1/storage/buckets/692a3b700039c02fb4bc/files/692b97e30027bf293efe/view?project=6926c7df002fa7831d94&mode=admin",
              avatarUrl:
                userDoc.avatarUrl ||
                userDoc.avatar ||
                "https://fra.cloud.appwrite.io/v1/storage/buckets/692a3b700039c02fb4bc/files/692b97e30027bf293efe/view?project=6926c7df002fa7831d94&mode=admin",
            };
          } else {
            // console.log(`❌ NO USER DOCUMENT FOUND for userId: ${userId}`);
            userDetails[userId] = {
              userName: "Anonymous",
              avatar:
                "https://fra.cloud.appwrite.io/v1/storage/buckets/692a3b700039c02fb4bc/files/692b97e30027bf293efe/view?project=6926c7df002fa7831d94&mode=admin",
              avatarUrl:
                "https://fra.cloud.appwrite.io/v1/storage/buckets/692a3b700039c02fb4bc/files/692b97e30027bf293efe/view?project=6926c7df002fa7831d94&mode=admin",
            };
          }
        } catch (err) {
          console.error(`❌ ERROR fetching user ${userId}:`, err.message);
          console.error("Full error:", err);
          userDetails[userId] = {
            userName: "Anonymous",
            avatar:
              "https://fra.cloud.appwrite.io/v1/storage/buckets/692a3b700039c02fb4bc/files/692b97e30027bf293efe/view?project=6926c7df002fa7831d94&mode=admin",
          };
        }
      }),
    );

    // console.log("\n📦 Final userDetails object:", JSON.stringify(userDetails, null, 2));

    console.log(
      "\n📦 Final userDetails object:",
      JSON.stringify(userDetails, null, 2),
    );

    // Enrich reviews with user data
    const enrichedReviews = reviewResponse.documents.map((doc) => {
      // ✅ PRIORITY 1: Use userName stored in review document (in case user was deleted)
      let userName = doc.userName || "Anonymous";
      let avatar =
        doc.avatar ||
        "https://fra.cloud.appwrite.io/v1/storage/buckets/692a3b700039c02fb4bc/files/692b97e30027bf293efe/view?project=6926c7df002fa7831d94&mode=admin";
      let avatarUrl = avatar;

      // ✅ PRIORITY 2: Override with fresh user data if user still exists
      if (userDetails[doc.userId]) {
        const user = userDetails[doc.userId];
        if (user.userName && user.userName !== "Anonymous") {
          userName = user.userName;
        }
        avatar = user.avatar;
        avatarUrl = user.avatarUrl;
      }

      // console.log(`\n🔄 Enriching review ${doc.$id}:`);
      // console.log("  - Review userId:", doc.userId);
      // console.log("  - Review stored userName:", doc.userName);
      // console.log("  - User lookup result:", userDetails[doc.userId]?.userName || "Not found");
      // console.log("  - Final userName:", userName);

      // Handle image URLs (single or multiple)
      let imageUrls = [];
      if (doc.image) {
        try {
          // Try to parse as JSON array (multiple images)
          imageUrls = JSON.parse(doc.image);
        } catch (e) {
          // Single image URL
          imageUrls = [doc.image];
        }
      }

      return {
        id: doc.$id,
        text: doc.reviewText,
        rating: doc.rating ?? 0,
        image: imageUrls.length > 0 ? imageUrls[0] : null,
        images: imageUrls,
        date: new Date(doc.createdAt).toDateString(),
        userName,
        avatar,
        avatarUrl,
        userId: doc.userId,
        productId: doc.productId,
      };
    });

    // console.log("\n✅ Enriched reviews count:", enrichedReviews.length);
    // console.log("📤 Sending response...\n");

    return res.status(200).json(enrichedReviews);
  } catch (error) {
    console.error("Error getting product reviews:", error);
    return res
      .status(500)
      .json({ message: "Failed to fetch product reviews." });
  }
};

const submitRating = async (req, res) => {
  try {
    const { productId, userId, userName, reviewText, rating } = req.body;

    if (!productId || !userId || !rating) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const reviewData = {
      productId,
      userId: String(userId),
      userName: userName || "Anonymous",
      reviewText: reviewText || "",
      rating: parseInt(rating, 10),
      createdAt: new Date().toISOString(),
    };

    const response = await db.createDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_REVIEW_COLLECTION_ID,
      ID.unique(),
      reviewData,
    );

    console.log("Review submitted:", response);
    return res
      .status(201)
      .json({ message: "Review submitted successfully", review: response });
  } catch (error) {
    console.error("Error submitting review:", error.message);
    return res
      .status(500)
      .json({ message: "Failed to submit review", error: error.message });
  }
};

const updateUserAvatar = async (req, res) => {
  try {
    if (!req.files || !req.files.avatar) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const { userId } = req.body;
    const file = req.files.avatar;

    if (!file) return res.status(400).json({ error: "No file uploaded" });

    const created = await storage.createFile(
      env.APPWRITE_STORAGE_ID,
      ID.unique(),
      InputFile.fromBuffer(file.data, file.name),
    );

    const avatarUrl = `${env.APPWRITE_ENDPOINT}/storage/buckets/${env.APPWRITE_STORAGE_ID}/files/${created.$id}/view?project=${env.APPWRITE_PROJECT_ID}`;

    const docs = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_USER_COLLECTION_ID,
      [Query.equal("$id", userId)],
    );

    if (docs.total === 0)
      return res.status(404).json({ error: "User profile not found" });

    const profileDocId = docs.documents[0].$id;

    await db.updateDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_USER_COLLECTION_ID,
      profileDocId,
      { avatarUrl, avatarFileId: created.$id },
    );

    res.json({ avatarUrl });
  } catch (error) {
    console.error("Avatar upload error:", error);
    res.status(500).json({ error: "Upload failed" });
  }
};

const getFeaturedProducts = async (req, res) => {
  try {
    const { showAll } = req.query; // Get the query parameter

    // Build the queries array based on the showAll parameter
    const queries = [
      Query.equal("isFeatured", true),
      Query.orderDesc("$createdAt"),
    ];
    if (showAll !== "true") {
      queries.push(Query.limit(50));
    }
    const response = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_FEATURED_COLLECTION_ID,
      queries,
    );

    res.status(200).json(response.documents);
  } catch (error) {
    console.error("Error fetching featured products:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
};

const getDealProducts = async (req, res) => {
  try {
    const { category, sortBy } = req.query;
    let queries = [Query.equal("isDeal", true)];

    // Add category filter if provided
    if (category && category !== "All Deals") {
      queries.push(Query.equal("category", category));
    }

    // Add sorting
    if (sortBy === "discount_desc") {
      queries.push(Query.orderDesc("discount"));
    } else if (sortBy === "newest") {
      queries.push(Query.orderDesc("$createdAt"));
    } else if (sortBy === "price_asc") {
      queries.push(Query.orderAsc("dealPrice"));
    } else {
      queries.push(Query.orderDesc("$updatedAt"));
    }

    const response = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_DEALS_COLLECTION_ID,
      queries,
    );

    // Enrich products with calculated data
    const enrichedProducts = response.documents.map((product) => {
      const discount = product.discount || 0;
      const timeLeft = calculateTimeLeft(
        product.dealEndTime || new Date(Date.now() + 24 * 60 * 60 * 1000),
      );

      return {
        ...product,
        discount: discount,
        timeLeft: timeLeft,
        originalPrice: product.price,
        price: product.dealPrice || product.price,
        isExpiringSoon: timeLeft.totalHours <= 6,
        isHighDiscount: discount >= 40,
        isPremium: product.premiumDeal || false,
      };
    });

    res.status(200).json(enrichedProducts);
  } catch (error) {
    console.error("Error fetching deal products:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
};

const getDealAnalytics = async (req, res) => {
  try {
    // Get all active deals
    const dealsResponse = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_DEALS_COLLECTION_ID,
      [Query.equal("isDeal", true)],
    );

    const deals = dealsResponse.documents;
    const totalDeals = deals.length;

    // Calculate analytics
    const maxDiscount = Math.max(...deals.map((d) => d.discount || 0));
    const averageDiscount =
      deals.reduce((sum, d) => sum + (d.discount || 0), 0) / totalDeals || 0;

    // Count deals ending soon (within 24 hours)
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const endingSoon = deals.filter((deal) => {
      const endTime = new Date(deal.dealEndTime || tomorrow);
      return endTime <= tomorrow;
    }).length;

    // Count premium deals
    const premiumDeals = deals.filter((d) => d.premiumDeal).length;

    // Count new arrivals (created in last 7 days)
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const newArrivals = deals.filter((deal) => {
      const createdTime = new Date(deal.$createdAt);
      return createdTime >= weekAgo;
    }).length;

    // Calculate time left for flash sale (find the deal with shortest time left)
    let globalTimeLeft = { hours: 23, minutes: 59, seconds: 59 };
    if (deals.length > 0) {
      const shortestDeal = deals.reduce((shortest, current) => {
        const currentEnd = new Date(current.dealEndTime || tomorrow);
        const shortestEnd = new Date(shortest.dealEndTime || tomorrow);
        return currentEnd < shortestEnd ? current : shortest;
      });

      globalTimeLeft = calculateTimeLeft(shortestDeal.dealEndTime || tomorrow);
    }

    res.status(200).json({
      totalDeals,
      maxDiscount: Math.floor(maxDiscount),
      averageDiscount: Math.floor(averageDiscount),
      endingSoon,
      premiumDeals,
      newArrivals,
      globalTimeLeft,
      isFlashSaleActive: totalDeals > 0,
      categories: {
        "All Deals": totalDeals,
        "Most Popular": Math.floor(totalDeals * 0.3),
        "Ending Soon": endingSoon,
        "Best Value": deals.filter((d) => (d.discount || 0) >= 40).length,
        "Premium Offers": premiumDeals,
        "New Arrivals": newArrivals,
      },
    });
  } catch (error) {
    console.error("Error fetching deal analytics:", error);
    res.status(500).json({ error: "Failed to fetch deal analytics" });
  }
};

const getGlobalDealCountdown = async (req, res) => {
  try {
    const now = new Date();

    // Get the deal that ends soonest
    const dealsResponse = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_DEALS_COLLECTION_ID,
      [
        Query.equal("isDeal", true),
        Query.greaterThan("dealEndTime", now.toISOString()),
        Query.orderAsc("dealEndTime"),
        Query.limit(1),
      ],
    );

    if (dealsResponse.documents.length === 0) {
      // No active deals, return default countdown
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      return res.json(calculateTimeLeft(tomorrow.toISOString()));
    }

    const nextEndingDeal = dealsResponse.documents[0];
    const timeLeft = calculateTimeLeft(nextEndingDeal.dealEndTime);

    res.json({
      ...timeLeft,
      dealId: nextEndingDeal.$id,
      dealName: nextEndingDeal.productName,
      hasActiveDeals: true,
    });
  } catch (error) {
    console.error("Error fetching global deal countdown:", error);
    // Return default countdown on error
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    res.json({
      ...calculateTimeLeft(tomorrow.toISOString()),
      hasActiveDeals: false,
    });
  }
};

// Helper function to calculate time left
const calculateTimeLeft = (endTime) => {
  const now = new Date();
  const end = new Date(endTime);
  const timeDiff = end.getTime() - now.getTime();

  if (timeDiff <= 0) {
    return { hours: 0, minutes: 0, seconds: 0, totalHours: 0 };
  }

  const hours = Math.floor(timeDiff / (1000 * 60 * 60));
  const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

  return { hours, minutes, seconds, totalHours: hours + minutes / 60 };
};

const getHeroProducts = async (req, res) => {
  try {
    const { documents: featured } = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_FEATURED_COLLECTION_ID,
      [Query.limit(3), Query.orderDesc("$createdAt")], // Limit to a few slides
    );

    const { documents: deals } = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_DEALS_COLLECTION_ID,
      [Query.limit(3), Query.orderDesc("$createdAt")], // Limit to a few slides
    );

    // Combine the two lists and send to the frontend
    res.status(200).json({ featured, deals });
  } catch (error) {
    console.error("Failed to fetch hero products:", error);
    res.status(500).json({ error: "Failed to fetch hero products." });
  }
};

const getCategories = async (req, res) => {
  try {
    const { documents } = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_CATEGORIES_COLLECTION_ID,
      [Query.limit(100), Query.orderAsc("name")],
    );

    const categories = documents.map((doc) => ({
      id: doc.$id,
      name: doc.name,
      img: doc.image,
    }));

    res.status(200).json(categories);
  } catch (error) {
    console.error("❌ Failed to fetch categories:", error);
    res.status(500).json({ error: "Failed to fetch categories." });
  }
};

const getProductsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    console.log(`🔍 Fetching products for category ID: ${categoryId}`);

    if (!categoryId || categoryId.trim() === "") {
      return res.status(400).json({
        success: false,
        error: "Category ID is required",
      });
    }

    // Verify category exists
    try {
      const categoryDoc = await db.getDocument(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_CATEGORIES_COLLECTION_ID,
        categoryId,
      );
      console.log(`✅ Category found: ${categoryDoc.name}`);
    } catch (error) {
      if (error.code === 404) {
        return res.status(404).json({
          success: false,
          error: "Category not found",
        });
      }
      throw error;
    }

    // ✅ Fetch ALL products by category regardless of approval status
    const products = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_PRODUCT_COLLECTION_ID,
      [
        Query.equal("categoryId", categoryId),
        Query.orderDesc("$createdAt"),
        Query.limit(100),
      ],
    );

    console.log(`✅ Found ${products.total} products`);

    res.status(200).json({
      success: true,
      products: products.documents,
      count: products.total,
    });
  } catch (error) {
    console.error("❌ Failed to fetch products by category:", error);

    if (error.code === 400) {
      return res.status(400).json({
        success: false,
        error: "Invalid category ID format",
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to fetch products for this category.",
      details: error.message,
    });
  }
};

const getCategoryBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const { documents } = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_CATEGORIES_COLLECTION_ID,
      [Query.equal("slug", slug), Query.limit(1)],
    );

    if (documents.length === 0) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.status(200).json(documents[0]);
  } catch (error) {
    console.error("❌ Failed to fetch category:", error);
    res.status(500).json({ error: "Failed to fetch category." });
  }
};

const getCategorie = async (req, res) => {
  try {
    const { documents } = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_CATEGORIES_COLLECTION_ID, // Use the correct ID for your categories collection
      [Query.limit(100), Query.orderAsc("name")], // Fetch up to 100 categories, ordered by name
    );

    // Assuming your category documents have 'name' and 'imgUrl' attributes
    const categories = documents.map((doc) => ({
      $id: doc.$id, // This is the ID you need for the product form
      name: doc.name,
      imgUrl: doc.imgUrl,
    }));

    res.status(200).json(categories);
  } catch (error) {
    console.error("❌ Failed to fetch categories:", error);
    res.status(500).json({ error: "Failed to fetch categories." });
  }
};

// A new controller to fetch a single category by its ID
const getCategoryById = async (req, res) => {
  try {
    const { categoryId } = req.params; // Get the ID from the URL

    // Fetch the single document from the categories collection
    const category = await db.getDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_CATEGORIES_COLLECTION_ID,
      categoryId,
    );

    // Map the document to the desired format
    const formattedCategory = {
      id: category.$id,
      name: category.name,
      img: category.image,
    };

    res.status(200).json(formattedCategory);
  } catch (error) {
    console.error("❌ Failed to fetch category by ID:", error);
    res.status(404).json({ error: "Category not found." });
  }
};

const getMobileCategories = async (req, res) => {
  try {
    const products = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_PRODUCT_COLLECTION_ID,
    );

    const categories = [
      "All",
      ...new Set(
        products.documents
          .map((p) => p.category)
          .filter((cat) => cat && cat.toLowerCase() !== "all"),
      ),
    ];

    res.json({ success: true, categories });
  } catch (err) {
    console.error("❌ Error fetching categories:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch categories" });
  }
};

const getMobileProducts = async (req, res) => {
  try {
    const { category, limit = 50, page = 1 } = req.query;

    let queries = [];

    // If a category is specified, add a filter query
    if (category && category !== "all") {
      queries.push(Query.equal("categoryId", category));
    }

    // ✅ Fetch ALL products regardless of approval status
    queries.push(Query.limit(parseInt(limit)));
    queries.push(Query.orderDesc("$createdAt"));

    // Add offset for pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    if (offset > 0) {
      queries.push(Query.offset(offset));
    }

    const products = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_PRODUCT_COLLECTION_ID,
      queries,
    );

    // ✅ ADD: Include review counts
    const productsWithReviews = await Promise.all(
      products.documents.map(async (doc) => {
        try {
          const reviews = await db.listDocuments(
            env.APPWRITE_DATABASE_ID,
            env.APPWRITE_REVIEW_COLLECTION_ID,
            [Query.equal("productId", doc.$id), Query.select(["rating"])],
          );

          const reviewCount = reviews.total || 0;
          const avgRating =
            reviewCount > 0
              ? reviews.documents.reduce((sum, r) => sum + (r.rating || 0), 0) /
                reviewCount
              : 0;

          return {
            ...doc,
            reviewCount,
            avgRating: parseFloat(avgRating.toFixed(1)),
          };
        } catch (error) {
          return {
            ...doc,
            reviewCount: 0,
            avgRating: 0,
          };
        }
      }),
    );

    res.json({
      success: true,
      products: productsWithReviews,
      total: products.total,
      page: parseInt(page),
      limit: parseInt(limit),
      hasMore: products.documents.length >= parseInt(limit),
    });
  } catch (err) {
    console.error("❌ Error fetching products:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch products" });
  }
};

const getProducts2 = async (req, res) => {
  try {
    const { category, search } = req.query;

    let queries = [Query.limit(100), Query.orderDesc("$createdAt")];

    if (category && category !== "all") {
      queries.push(Query.equal("categoryId", category));
    }
    if (search) {
      queries.push(Query.search("productName", search));
    }

    console.log("Queries:", queries);

    const allProducts = [];
    let cursor = null;

    // ✅ Fetch ALL products regardless of approval status
    while (true) {
      const batchQueries = [
        ...queries,
        ...(cursor ? [Query.cursorAfter(cursor)] : []),
      ];

      const batch = await db.listDocuments(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_PRODUCT_COLLECTION_ID,
        batchQueries,
      );

      allProducts.push(...batch.documents);
      if (batch.documents.length < 100) break;
      cursor = batch.documents[batch.documents.length - 1].$id;
    }

    res.json({
      success: true,
      products: allProducts,
      total: allProducts.length,
    });
  } catch (err) {
    console.error("❌ Error fetching products:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    });
  }
};

module.exports = {
  getCustomerProfile,
  updateCurrencyRates,
  getCustomerOrders,
  saveRecentSearch,
  getRecentSearches,
  clearRecentSearches,
  getFeaturedProducts,
  getProducts,
  submitReview,
  incrementProductRatingsCount,
  getProductReviews,
  submitRating,
  updateUserAvatar,
  getCategories,
  getProductsForMobile,
  getDealProducts,
  getDealAnalytics,
  getGlobalDealCountdown,
  getHeroProducts,
  getProductsByCategory,
  getCategoryBySlug,
  getMobileCategories,
  getMobileProducts,
  getCategorie,
  getCategoryById,
  getProducts2,
  getPopularSearches,
};
