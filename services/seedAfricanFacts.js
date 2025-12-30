/**
 * Seed Script for African Facts
 *
 * This script populates the africanFacts collection with initial data
 * from the frontend static data.
 *
 * Usage:
 * node seedAfricanFacts.js
 */

const { Databases, ID } = require("node-appwrite");
const { client } = require("./services/appwriteService");
const { env } = require("./src/env");

const databases = new Databases(client);

const DATABASE_ID = env.APPWRITE_DATABASE_ID;
const AFRICAN_FACTS_COLLECTION =
  env.AFRICAN_FACTS_COLLECTION_ID || "africanFacts";
const AFRICAN_PROVERBS_COLLECTION =
  env.AFRICAN_PROVERBS_COLLECTION_ID || "africanProverbs";

// Sample data (from your frontend)
const africanFacts = [
  {
    category: "nature",
    title: "The Great Migration",
    description:
      "Witness the largest mammal migration on Earth where over 1.5 million wildebeest, zebras, and gazelles travel between Serengeti and Masai Mara in search of fresh grazing.",
    image:
      "https://images.unsplash.com/photo-1550358864-518f202c02ba?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    location: "Serengeti & Masai Mara",
    iconName: "Compass",
    gradient: "from-emerald-500 to-green-700",
    tags: ["Migration", "Wildlife", "Nature"],
    duration: "July - October",
    featured: true,
    active: true,
    sortOrder: 1,
  },
  {
    category: "culture",
    title: "The Maasai Warriors",
    description:
      "The Maasai people of Kenya and Tanzania are renowned for their distinctive customs, vibrant red clothing (shuka), and warrior traditions that have been preserved for centuries.",
    image:
      "https://images.unsplash.com/photo-1551816230-ef5deaed4a26?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    location: "Kenya & Tanzania",
    iconName: "Shield",
    gradient: "from-red-500 to-amber-700",
    tags: ["Culture", "Tradition", "Heritage"],
    population: "2 Million+",
    featured: true,
    active: true,
    sortOrder: 2,
  },
  {
    category: "nature",
    title: "Mount Kilimanjaro",
    description:
      "Africa's highest peak at 5,895 meters, Mount Kilimanjaro is the world's tallest free-standing mountain and features multiple climate zones from tropical to arctic.",
    image:
      "https://images.unsplash.com/photo-1589553416267-f19c6ea15258?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    location: "Tanzania",
    iconName: "Mountain",
    gradient: "from-blue-500 to-indigo-700",
    tags: ["Mountain", "Adventure", "Nature"],
    height: "5,895m",
    featured: true,
    active: true,
    sortOrder: 3,
  },
  {
    category: "history",
    title: "Ancient Nubian Pyramids",
    description:
      "Sudan has more pyramids than Egypt, with over 200 Nubian pyramids built by the rulers of ancient Kush between 2500 BCE and 300 CE.",
    image:
      "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    location: "Sudan",
    iconName: "Award",
    gradient: "from-amber-500 to-yellow-700",
    tags: ["History", "Archaeology", "Ancient"],
    count: "200+ Pyramids",
    featured: true,
    active: true,
    sortOrder: 4,
  },
  {
    category: "wildlife",
    title: "Big Five Safari Experience",
    description:
      "Africa is home to the legendary 'Big Five' - lion, leopard, rhinoceros, elephant, and Cape buffalo, offering unparalleled wildlife viewing opportunities.",
    image:
      "https://images.unsplash.com/photo-1516426122078-c23e76319801?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    location: "Across Africa",
    iconName: "Trophy",
    gradient: "from-orange-500 to-red-700",
    tags: ["Safari", "Wildlife", "Adventure"],
    animals: "Lion, Leopard, Rhino, Elephant, Buffalo",
    featured: true,
    active: true,
    sortOrder: 5,
  },
  {
    category: "art",
    title: "Ndebele House Painting",
    description:
      "The Ndebele people of South Africa are famous for their vibrant geometric house paintings, a tradition passed down through generations of women.",
    image:
      "https://images.unsplash.com/photo-1586769852044-692eb802d383?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    location: "South Africa",
    iconName: "Sparkles",
    gradient: "from-fuchsia-500 to-purple-700",
    tags: ["Art", "Tradition", "Color"],
    tradition: "Women's Art Form",
    featured: false,
    active: true,
    sortOrder: 6,
  },
  {
    category: "culture",
    title: "Ethiopian Coffee Ceremony",
    description:
      "Coffee was discovered in Ethiopia, and the traditional coffee ceremony is a sacred ritual involving roasting, grinding, and brewing coffee three times.",
    image:
      "https://images.unsplash.com/photo-1553272725-0863a1d876d3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    location: "Ethiopia",
    iconName: "Coffee",
    gradient: "from-brown-500 to-amber-700",
    tags: ["Coffee", "Ritual", "Tradition"],
    origin: "Birthplace of Coffee",
    featured: false,
    active: true,
    sortOrder: 7,
  },
  {
    category: "nature",
    title: "Okavango Delta",
    description:
      "The world's largest inland delta, a UNESCO World Heritage site where floodwaters create a unique ecosystem supporting incredible biodiversity.",
    image:
      "https://images.unsplash.com/photo-1589553149086-b8299ee030ba?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    location: "Botswana",
    iconName: "Leaf",
    gradient: "from-teal-500 to-green-700",
    tags: ["Delta", "Wildlife", "UNESCO"],
    size: "15,000 km²",
    featured: false,
    active: true,
    sortOrder: 8,
  },
];

const africanProverbs = [
  {
    proverb: "It takes a village to raise a child.",
    language: "Various",
    region: "Pan-African",
    active: true,
    sortOrder: 1,
  },
  {
    proverb: "A spider's web is stronger than it looks.",
    language: "Ashanti",
    country: "Ghana",
    region: "West Africa",
    active: true,
    sortOrder: 2,
  },
  {
    proverb: "Do not look where you fell, but where you slipped.",
    language: "Various",
    region: "Pan-African",
    active: true,
    sortOrder: 3,
  },
  {
    proverb: "He who learns, teaches.",
    language: "Ethiopian",
    country: "Ethiopia",
    region: "East Africa",
    active: true,
    sortOrder: 4,
  },
  {
    proverb: "Smooth seas do not make skillful sailors.",
    language: "Various",
    region: "Pan-African",
    active: true,
    sortOrder: 5,
  },
  {
    proverb: "A tree is known by its fruit.",
    language: "Various",
    region: "Pan-African",
    active: true,
    sortOrder: 6,
  },
  {
    proverb:
      "When there is no enemy within, the enemies outside cannot hurt you.",
    language: "Various",
    region: "Pan-African",
    active: true,
    sortOrder: 7,
  },
];

/**
 * Seed African Facts
 */
async function seedAfricanFacts() {
  console.log("Seeding African Facts...\n");

  for (const fact of africanFacts) {
    try {
      const document = await databases.createDocument(
        DATABASE_ID,
        AFRICAN_FACTS_COLLECTION,
        ID.unique(),
        fact
      );
      console.log(`✓ Created: ${fact.title}`);
    } catch (error) {
      console.error(`✗ Error creating ${fact.title}:`, error.message);
    }
  }

  console.log("\n✓ African Facts seeding complete!");
}

/**
 * Seed African Proverbs
 */
async function seedAfricanProverbs() {
  console.log("\nSeeding African Proverbs...\n");

  for (const proverb of africanProverbs) {
    try {
      const document = await databases.createDocument(
        DATABASE_ID,
        AFRICAN_PROVERBS_COLLECTION,
        ID.unique(),
        proverb
      );
      console.log(`✓ Created: "${proverb.proverb.substring(0, 50)}..."`);
    } catch (error) {
      console.error(`✗ Error creating proverb:`, error.message);
    }
  }

  console.log("\n✓ African Proverbs seeding complete!");
}

/**
 * Main execution
 */
async function main() {
  console.log("=".repeat(60));
  console.log("Seeding African Facts & Proverbs");
  console.log("=".repeat(60));
  console.log("\n");

  await seedAfricanFacts();
  await seedAfricanProverbs();

  console.log("\n" + "=".repeat(60));
  console.log("Seeding Complete!");
  console.log("=".repeat(60));
}

// Run the script
main().catch(console.error);
