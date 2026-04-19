const dotenv = require("dotenv");
const { MongoClient } = require("mongodb");
const { datasetConfig } = require("../src/config/dataset");

dotenv.config();

const indexPlan = [
  {
    collection: datasetConfig.collections.orders,
    indexes: [
      { key: { order_id: 1 }, options: { name: "order_id_idx" } },
      { key: { customer_id: 1 }, options: { name: "customer_id_idx" } },
      {
        key: { order_purchase_timestamp: 1 },
        options: { name: "order_purchase_timestamp_idx" }
      },
      { key: { order_status: 1 }, options: { name: "order_status_idx" } }
    ]
  },
  {
    collection: datasetConfig.collections.orderItems,
    indexes: [
      { key: { order_id: 1 }, options: { name: "order_items_order_id_idx" } },
      { key: { product_id: 1 }, options: { name: "order_items_product_id_idx" } },
      { key: { seller_id: 1 }, options: { name: "order_items_seller_id_idx" } }
    ]
  },
  {
    collection: datasetConfig.collections.customers,
    indexes: [
      { key: { customer_id: 1 }, options: { name: "customer_id_idx" } },
      { key: { customer_unique_id: 1 }, options: { name: "customer_unique_id_idx" } },
      { key: { customer_state: 1, customer_city: 1 }, options: { name: "customer_region_idx" } }
    ]
  },
  {
    collection: datasetConfig.collections.products,
    indexes: [
      { key: { product_id: 1 }, options: { name: "product_id_idx" } },
      {
        key: { product_category_name: 1 },
        options: { name: "product_category_name_idx" }
      }
    ]
  },
  {
    collection: datasetConfig.collections.payments,
    indexes: [
      { key: { order_id: 1 }, options: { name: "payments_order_id_idx" } },
      { key: { payment_type: 1 }, options: { name: "payment_type_idx" } }
    ]
  },
  {
    collection: datasetConfig.collections.reviews,
    indexes: [
      { key: { order_id: 1 }, options: { name: "reviews_order_id_idx" } },
      { key: { review_score: 1 }, options: { name: "review_score_idx" } }
    ]
  },
  {
    collection: datasetConfig.collections.categoryTranslations,
    indexes: [
      {
        key: { product_category_name: 1 },
        options: { name: "category_translation_name_idx" }
      }
    ]
  }
];

async function main() {
  if (!process.env.MONGODB_URI || !process.env.MONGODB_DB) {
    throw new Error("Set MONGODB_URI and MONGODB_DB in your .env file before creating indexes.");
  }

  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB);

    for (const entry of indexPlan) {
      const collection = db.collection(entry.collection);
      for (const definition of entry.indexes) {
        const name = await collection.createIndex(definition.key, definition.options);
        console.log(`Created index ${name} on ${entry.collection}`);
      }
    }
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
