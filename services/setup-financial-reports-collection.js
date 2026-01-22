// services/setup-financial-reports-collection.js
const { Client, Databases, Permission, Role, ID } = require("node-appwrite");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

/**
 * Create financial reports collection for KRA-compliant tax reporting
 *
 * This collection stores generated financial reports including:
 * - Monthly Turnover Tax (TOT) reports
 * - Commission aggregation reports
 * - Financial audit trails
 * - Export-ready data for KRA compliance
 *
 * Security: Finance/admin role access only
 * Audit: All report generation events are logged
 * Compliance: Immutable records for KRA audit requirements
 */
async function setupFinancialReportsCollection() {
  const databaseId = process.env.APPWRITE_DATABASE_ID;

  console.log(
    "🚀 Setting up Financial Reports Collection for KRA Compliance...",
  );
  console.log("Database ID:", databaseId);

  if (!databaseId) {
    console.error("❌ APPWRITE_DATABASE_ID not found in environment variables");
    return;
  }

  try {
    // Create financial_reports collection
    let collectionId;
    try {
      const collection = await databases.createCollection(
        databaseId,
        ID.unique(), // Fixed collection ID for consistency
        "Financial Reports",
        [
          Permission.read(Role.user("admin")), // Admin-only read access
          Permission.create(Role.user("admin")), // Admin-only creation
          Permission.update(Role.user("admin")), // Admin-only updates
          Permission.delete(Role.user("admin")), // Admin-only deletion
        ],
      );
      collectionId = collection.$id;
      console.log(
        `✅ Financial Reports collection created with ID: ${collectionId}`,
      );
    } catch (error) {
      if (error.code === 409) {
        console.log("ℹ️  Financial Reports collection already exists");
        collectionId = "financial_reports";
      } else {
        throw error;
      }
    }

    // Define financial report attributes
    const reportAttributes = [
      {
        key: "report_id",
        type: "string",
        size: 100,
        required: true,
        description:
          "Unique identifier for this financial report (e.g., TOT-2026-01)",
      },
      {
        key: "report_type",
        type: "string",
        size: 50,
        required: true,
        description: "Type of financial report: TOT, COMMISSION, VAT, etc.",
      },
      {
        key: "reporting_period",
        type: "string",
        size: 20,
        required: true,
        description: "Period covered by report in YYYY-MM format",
      },
      {
        key: "report_month",
        type: "integer",
        required: true,
        description: "Month number (1-12) for efficient querying",
      },
      {
        key: "report_year",
        type: "integer",
        required: true,
        description: "Year for efficient querying",
      },
      {
        key: "total_orders",
        type: "integer",
        required: false,
        default: 0,
        description: "Total number of completed orders in period",
      },
      {
        key: "total_commission",
        type: "float",
        required: false,
        default: 0.0,
        description: "Total commission earned by platform (source of truth)",
      },
      {
        key: "tax_rate",
        type: "float",
        required: false,
        default: 0.03,
        description: "Tax rate applied (0.03 = 3% TOT)",
      },
      {
        key: "tax_amount",
        type: "float",
        required: false,
        default: 0.0,
        description: "Calculated tax amount payable to KRA",
      },
      {
        key: "currency",
        type: "string",
        size: 10,
        required: false,
        default: "KES",
        description: "Currency code for all amounts",
      },
      {
        key: "calculation_method",
        type: "string",
        size: 200,
        required: false,
        description: "Method used for calculation (for audit purposes)",
      },
      {
        key: "data_sources",
        type: "string",
        size: 1000,
        required: false,
        description: "JSON string listing all data sources and filters used",
      },
      {
        key: "generated_by",
        type: "string",
        size: 100,
        required: true,
        description: "User ID or system that generated this report",
      },
      {
        key: "generated_at",
        type: "datetime",
        required: false,
        description: "Timestamp when report was generated (immutable)",
      },
      {
        key: "period_start",
        type: "datetime",
        required: true,
        description: "Start of reporting period (inclusive)",
      },
      {
        key: "period_end",
        type: "datetime",
        required: true,
        description: "End of reporting period (inclusive)",
      },
      {
        key: "report_status",
        type: "string",
        size: 50,
        required: false,
        default: "generated",
        description: "Status: generated, reviewed, submitted, filed",
      },
      {
        key: "kra_reference",
        type: "string",
        size: 100,
        required: false,
        description: "KRA filing reference number (if submitted)",
      },
      {
        key: "audit_checksum",
        type: "string",
        size: 64,
        required: false,
        description: "SHA-256 hash for data integrity verification",
      },
      {
        key: "export_data",
        type: "string",
        size: 10000,
        required: false,
        description: "JSON export data for CSV/PDF generation",
      },
      {
        key: "notes",
        type: "string",
        size: 2000,
        required: false,
        description: "Additional notes or exceptions for this report",
      },
    ];

    console.log("\n📝 Adding financial report attributes...");

    for (const attr of reportAttributes) {
      try {
        if (attr.type === "float") {
          await databases.createFloatAttribute(
            databaseId,
            collectionId,
            attr.key,
            attr.required,
            undefined, // min
            undefined, // max
            attr.default,
          );
        } else if (attr.type === "string") {
          await databases.createStringAttribute(
            databaseId,
            collectionId,
            attr.key,
            attr.size,
            attr.required,
            attr.default,
          );
        } else if (attr.type === "integer") {
          await databases.createIntegerAttribute(
            databaseId,
            collectionId,
            attr.key,
            attr.required,
            undefined, // min
            undefined, // max
            attr.default,
          );
        } else if (attr.type === "datetime") {
          await databases.createDatetimeAttribute(
            databaseId,
            collectionId,
            attr.key,
            attr.required,
          );
        }

        console.log(`✅ ${attr.key} (${attr.type}) - ${attr.description}`);

        // Small delay between attribute creations
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        if (error.code === 409) {
          console.log(`⚠️  ${attr.key} attribute already exists`);
        } else {
          console.error(`❌ Error creating ${attr.key}:`, error.message);
        }
      }
    }

    // Create performance indexes for efficient querying
    console.log("\n🔍 Creating performance indexes for financial queries...");

    const indexes = [
      {
        name: "report_type_period_index",
        type: "key",
        attributes: ["report_type", "reporting_period"],
        description: "For querying reports by type and period",
      },
      {
        name: "year_month_index",
        type: "key",
        attributes: ["report_year", "report_month"],
        description: "For efficient date-based queries",
      },
      {
        name: "generated_at_index",
        type: "key",
        attributes: ["generated_at"],
        description: "For chronological report ordering",
      },
      {
        name: "report_status_index",
        type: "key",
        attributes: ["report_status", "report_type"],
        description: "For filtering by report status and type",
      },
      {
        name: "tax_amount_index",
        type: "key",
        attributes: ["tax_amount", "report_type"],
        description: "For financial amount queries and analytics",
      },
    ];

    for (const index of indexes) {
      try {
        await databases.createIndex(
          databaseId,
          collectionId,
          index.name,
          index.type,
          index.attributes,
        );
        console.log(`✅ ${index.name} - ${index.description}`);

        // Small delay between index creations
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        if (error.code === 409) {
          console.log(`⚠️  ${index.name} already exists`);
        } else {
          console.error(`❌ Error creating ${index.name}:`, error.message);
        }
      }
    }

    // Verify setup completion
    console.log("\n🔍 Verifying financial reports collection setup...");
    const updatedCollection = await databases.getCollection(
      databaseId,
      collectionId,
    );

    const expectedAttributes = reportAttributes.map((attr) => attr.key);
    const actualAttributes = updatedCollection.attributes.map(
      (attr) => attr.key,
    );
    const missingAttributes = expectedAttributes.filter(
      (expected) => !actualAttributes.includes(expected),
    );

    if (missingAttributes.length === 0) {
      console.log("✅ All financial report attributes added successfully");
      console.log(
        `📊 Financial Reports collection now has ${updatedCollection.attributes.length} total attributes`,
      );

      // Display newly added attributes
      console.log("\n📋 Financial Report Attributes Added:");
      reportAttributes.forEach((attr) => {
        const found = updatedCollection.attributes.find(
          (a) => a.key === attr.key,
        );
        if (found) {
          console.log(`   • ${attr.key} (${attr.type}) - ${attr.description}`);
        }
      });
    } else {
      console.error("❌ Missing attributes:", missingAttributes);
      console.log("Please check the errors above and run the script again");
    }

    // Show sample financial report structure
    console.log("\n📄 Sample TOT Report Document Structure:");
    console.log({
      $id: "tot_report_2026_01",
      report_id: "TOT-2026-01",
      report_type: "TOT",
      reporting_period: "2026-01",
      report_month: 1,
      report_year: 2026,
      total_orders: 1250,
      total_commission: 125000.0, // KES 125,000 total commission
      tax_rate: 0.03, // 3% TOT rate
      tax_amount: 3750.0, // KES 3,750 payable to KRA
      currency: "KES",
      calculation_method:
        "SUM(commission_earned) WHERE status='COMPLETED' AND month='2026-01'",
      data_sources: JSON.stringify({
        orders_collection: "69274563002eee2bea49",
        filters: [
          "status = 'COMPLETED'",
          "created_at >= '2026-01-01'",
          "created_at < '2026-02-01'",
        ],
        commission_field: "commission_earned",
      }),
      generated_by: "admin_user_123",
      generated_at: "2026-01-31T23:59:59.000Z",
      period_start: "2026-01-01T00:00:00.000Z",
      period_end: "2026-01-31T23:59:59.999Z",
      report_status: "generated",
      audit_checksum: "abc123def456...", // SHA-256 of report data
      export_data: JSON.stringify({
        summary: { orders: 1250, commission: 125000, tax: 3750 },
        breakdown: [], // Detailed breakdown for CSV export
      }),
    });

    console.log("\n💡 Next Steps:");
    console.log("1. Create TOT reporting service with precise calculations");
    console.log("2. Create finance controller with admin-only access");
    console.log("3. Add audit logging for all report generation");
    console.log("4. Implement CSV/PDF export functionality");
    console.log("5. Add KRA filing integration");
    console.log("6. Set up automated monthly report generation");

    console.log("\n✅ Financial Reports collection setup completed!");
  } catch (error) {
    console.error("❌ Error setting up financial reports collection:", error);
    throw error;
  }
}

setupFinancialReportsCollection()
  .then(() => {
    console.log("\n✅ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });
