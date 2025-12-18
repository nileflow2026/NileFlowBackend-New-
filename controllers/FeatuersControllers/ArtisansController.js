// backend/api/artisans.js - Example API structure
const express = require("express");
const router = express.Router();

// Get artisan by ID
router.get("/:artisanId", async (req, res) => {
  try {
    const artisan = await database.getArtisan(req.params.artisanId);
    res.json({
      id: artisan.id,
      name: artisan.name,
      photo: artisan.photo,
      country: artisan.country,
      village: artisan.village,
      ethnicGroup: artisan.ethnic_group,
      language: artisan.language,
      bio: artisan.bio,
      story: artisan.story,
      craftType: artisan.craft_type,
      yearsCrafting: artisan.years_crafting,
      familySupported: artisan.family_supported,
      apprenticesTrained: artisan.apprentices_trained,
      rating: artisan.rating,
      reviewCount: artisan.review_count,
      followers: artisan.followers,
      totalEarned: artisan.total_earned,
      communityProjects: artisan.community_projects,
      isVerified: artisan.is_verified,
      skills: artisan.skills || [],
      videoUrl: artisan.video_url,
      videoThumbnail: artisan.video_thumbnail,
      craftDetails: artisan.craft_details || {},
      impactStories: artisan.impact_stories || [],
      joinedYear: artisan.joined_year,
      establishedYear: artisan.established_year,
      workshopLocation: artisan.workshop_location,
      teamSize: artisan.team_size,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch artisan data" });
  }
});

// Get artisan's products
router.get("/:artisanId/products", async (req, res) => {
  try {
    const products = await database.getArtisanProducts(req.params.artisanId);
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch artisan products" });
  }
});

// Get artisan by product ID
router.get("/product/:productId", async (req, res) => {
  try {
    const artisan = await database.getArtisanByProduct(req.params.productId);
    res.json(artisan);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch artisan" });
  }
});


-- Artisans table
CREATE TABLE artisans (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  photo VARCHAR(500),
  country VARCHAR(100),
  village VARCHAR(100),
  ethnic_group VARCHAR(100),
  language VARCHAR(100),
  bio TEXT,
  story TEXT,
  craft_type VARCHAR(100),
  years_crafting INT DEFAULT 0,
  family_supported INT DEFAULT 0,
  apprentices_trained INT DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0.00,
  review_count INT DEFAULT 0,
  followers INT DEFAULT 0,
  total_earned DECIMAL(10,2) DEFAULT 0.00,
  community_projects INT DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  video_url VARCHAR(500),
  video_thumbnail VARCHAR(500),
  craft_details JSON,
  impact_stories JSON,
  joined_year YEAR,
  established_year YEAR,
  workshop_location VARCHAR(255),
  team_size INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Artisan skills junction table
CREATE TABLE artisan_skills (
  artisan_id VARCHAR(255),
  skill VARCHAR(100),
  years INT DEFAULT 0,
  PRIMARY KEY (artisan_id, skill),
  FOREIGN KEY (artisan_id) REFERENCES artisans(id)
);

-- Products to artisans relationship
ALTER TABLE products ADD COLUMN artisan_id VARCHAR(255);
ALTER TABLE products ADD FOREIGN KEY (artisan_id) REFERENCES artisans(id);




// In your ProductPage.jsx, add this section:

<div className="mt-12">
  <h2 className="text-2xl font-bold text-white mb-6">Meet the Artisan</h2>
  <ArtisanStories productId={productId} />
</div>

// In ProductCard.jsx, add artisan badge:
<div className="mt-4">
  <ArtisanBadge artisan={product.artisan} compact={true} />
</div>