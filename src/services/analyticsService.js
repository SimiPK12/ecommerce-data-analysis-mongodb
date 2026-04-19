const { connectToDatabase } = require("../config/db");
const { getCollection, getField, fieldPath } = require("../config/dataset");

const ENTITY = {
  customers: "customers",
  geolocation: "geolocation",
  orderItems: "orderItems",
  payments: "payments",
  reviews: "reviews",
  orders: "orders",
  products: "products",
  sellers: "sellers",
  categoryTranslations: "categoryTranslations"
};

const COLLECTIONS = {
  customers: getCollection(ENTITY.customers),
  geolocation: getCollection(ENTITY.geolocation),
  orderItems: getCollection(ENTITY.orderItems),
  payments: getCollection(ENTITY.payments),
  reviews: getCollection(ENTITY.reviews),
  orders: getCollection(ENTITY.orders),
  products: getCollection(ENTITY.products),
  sellers: getCollection(ENTITY.sellers),
  categoryTranslations: getCollection(ENTITY.categoryTranslations)
};

function lookupFirstValue(arrayPath, fieldName, fallback = "Unknown") {
  return {
    $ifNull: [{ $arrayElemAt: [`$${arrayPath}.${fieldName}`, 0] }, fallback]
  };
}

function revenueExpression(prefix = "") {
  return {
    $add: [
      { $ifNull: [`$${prefix}${getField(ENTITY.orderItems, "price")}`, 0] },
      { $ifNull: [`$${prefix}${getField(ENTITY.orderItems, "freightValue")}`, 0] }
    ]
  };
}

function itemVariableRevenueExpression(variableName = "item") {
  return {
    $add: [
      { $ifNull: [`$$${variableName}.${getField(ENTITY.orderItems, "price")}`, 0] },
      { $ifNull: [`$$${variableName}.${getField(ENTITY.orderItems, "freightValue")}`, 0] }
    ]
  };
}

const queryDefinitions = {
  topCustomers: {
    title: "Top Customers by Purchase Frequency",
    insight:
      "Ranks real customers using customer_unique_id and estimates total spend from order items plus freight.",
    collection: COLLECTIONS.orders,
    buildPipeline: () => [
      {
        $lookup: {
          from: COLLECTIONS.customers,
          localField: getField(ENTITY.orders, "customerId"),
          foreignField: getField(ENTITY.customers, "id"),
          as: "customer"
        }
      },
      { $unwind: "$customer" },
      {
        $lookup: {
          from: COLLECTIONS.orderItems,
          localField: getField(ENTITY.orders, "id"),
          foreignField: getField(ENTITY.orderItems, "orderId"),
          as: "items"
        }
      },
      {
        $addFields: {
          orderRevenue: {
            $sum: {
              $map: {
                input: "$items",
                as: "item",
                in: itemVariableRevenueExpression("item")
              }
            }
          }
        }
      },
      {
        $group: {
          _id: `$customer.${getField(ENTITY.customers, "uniqueId")}`,
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: "$orderRevenue" },
          customerCity: { $first: `$customer.${getField(ENTITY.customers, "city")}` },
          customerState: { $first: `$customer.${getField(ENTITY.customers, "state")}` }
        }
      },
      { $sort: { totalOrders: -1, totalSpent: -1 } },
      { $limit: 10 },
      {
        $project: {
          _id: 0,
          customerUniqueId: "$_id",
          customerCity: 1,
          customerState: 1,
          totalOrders: 1,
          totalSpent: { $round: ["$totalSpent", 2] }
        }
      }
    ]
  },
  mostSoldProducts: {
    title: "Most Sold Products",
    insight:
      "Measures demand using the order_items collection and translates category labels into English where available.",
    collection: COLLECTIONS.orderItems,
    buildPipeline: () => [
      {
        $group: {
          _id: fieldPath(ENTITY.orderItems, "productId"),
          unitsSold: { $sum: 1 },
          totalRevenue: { $sum: revenueExpression() }
        }
      },
      { $sort: { unitsSold: -1, totalRevenue: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: COLLECTIONS.products,
          localField: "_id",
          foreignField: getField(ENTITY.products, "id"),
          as: "product"
        }
      },
      {
        $lookup: {
          from: COLLECTIONS.categoryTranslations,
          localField: `product.${getField(ENTITY.products, "categoryName")}`,
          foreignField: getField(ENTITY.categoryTranslations, "categoryName"),
          as: "translation"
        }
      },
      {
        $project: {
          _id: 0,
          productId: "$_id",
          category: lookupFirstValue("product", getField(ENTITY.products, "categoryName")),
          categoryEnglish: lookupFirstValue(
            "translation",
            getField(ENTITY.categoryTranslations, "categoryEnglishName")
          ),
          unitsSold: 1,
          totalRevenue: { $round: ["$totalRevenue", 2] }
        }
      }
    ]
  },
  monthlySalesTrends: {
    title: "Monthly Sales Trends",
    insight:
      "Tracks monthly order volume and sales revenue by combining order timestamps with item-level revenue.",
    collection: COLLECTIONS.orders,
    buildPipeline: () => [
      {
        $lookup: {
          from: COLLECTIONS.orderItems,
          localField: getField(ENTITY.orders, "id"),
          foreignField: getField(ENTITY.orderItems, "orderId"),
          as: "items"
        }
      },
      {
        $addFields: {
          orderRevenue: {
            $sum: {
              $map: {
                input: "$items",
                as: "item",
                in: itemVariableRevenueExpression("item")
              }
            }
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: fieldPath(ENTITY.orders, "purchaseTimestamp") },
            month: { $month: fieldPath(ENTITY.orders, "purchaseTimestamp") }
          },
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$orderRevenue" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      {
        $project: {
          _id: 0,
          year: "$_id.year",
          month: "$_id.month",
          totalOrders: 1,
          totalRevenue: { $round: ["$totalRevenue", 2] }
        }
      }
    ]
  },
  paymentMethodDistribution: {
    title: "Payment Method Distribution",
    insight: "Shows how customers pay, including frequency, value, and average installment count.",
    collection: COLLECTIONS.payments,
    buildPipeline: () => [
      {
        $group: {
          _id: fieldPath(ENTITY.payments, "paymentType"),
          transactionCount: { $sum: 1 },
          totalAmount: { $sum: fieldPath(ENTITY.payments, "paymentValue") },
          averageInstallments: { $avg: fieldPath(ENTITY.payments, "installments") }
        }
      },
      { $sort: { transactionCount: -1 } },
      {
        $project: {
          _id: 0,
          paymentMethod: "$_id",
          transactionCount: 1,
          totalAmount: { $round: ["$totalAmount", 2] },
          averageInstallments: { $round: ["$averageInstallments", 2] }
        }
      }
    ]
  },
  
  regionalOrderDistribution: {
    title: "Regional Order Distribution",
    insight:
      "Compares order activity across customer cities and states with revenue estimated from the related order items.",
    collection: COLLECTIONS.orders,
    buildPipeline: () => [
      {
        $lookup: {
          from: COLLECTIONS.customers,
          localField: getField(ENTITY.orders, "customerId"),
          foreignField: getField(ENTITY.customers, "id"),
          as: "customer"
        }
      },
      { $unwind: "$customer" },
      {
        $lookup: {
          from: COLLECTIONS.orderItems,
          localField: getField(ENTITY.orders, "id"),
          foreignField: getField(ENTITY.orderItems, "orderId"),
          as: "items"
        }
      },
      {
        $addFields: {
          orderRevenue: {
            $sum: {
              $map: {
                input: "$items",
                as: "item",
                in: itemVariableRevenueExpression("item")
              }
            }
          }
        }
      },
      {
        $group: {
          _id: {
            state: `$customer.${getField(ENTITY.customers, "state")}`,
            city: `$customer.${getField(ENTITY.customers, "city")}`
          },
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$orderRevenue" }
        }
      },
      { $sort: { totalOrders: -1, totalRevenue: -1 } },
      { $limit: 15 },
      {
        $project: {
          _id: 0,
          state: "$_id.state",
          city: "$_id.city",
          totalOrders: 1,
          totalRevenue: { $round: ["$totalRevenue", 2] }
        }
      }
    ]
  },

  productRatingAnalysis: {
    title: "Product Rating Analysis",
    insight:
      "Approximates product-level ratings by linking each order review to the products contained in that order.",
    collection: COLLECTIONS.reviews,
    buildPipeline: () => [
      {
        $lookup: {
          from: COLLECTIONS.orderItems,
          localField: getField(ENTITY.reviews, "orderId"),
          foreignField: getField(ENTITY.orderItems, "orderId"),
          as: "items"
        }
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: `$items.${getField(ENTITY.orderItems, "productId")}`,
          averageRating: { $avg: fieldPath(ENTITY.reviews, "score") },
          totalReviews: { $sum: 1 }
        }
      },
      { $sort: { averageRating: -1, totalReviews: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: COLLECTIONS.products,
          localField: "_id",
          foreignField: getField(ENTITY.products, "id"),
          as: "product"
        }
      },
      {
        $lookup: {
          from: COLLECTIONS.categoryTranslations,
          localField: `product.${getField(ENTITY.products, "categoryName")}`,
          foreignField: getField(ENTITY.categoryTranslations, "categoryName"),
          as: "translation"
        }
      },
      {
        $project: {
          _id: 0,
          productId: "$_id",
          category: lookupFirstValue("product", getField(ENTITY.products, "categoryName")),
          categoryEnglish: lookupFirstValue(
            "translation",
            getField(ENTITY.categoryTranslations, "categoryEnglishName")
          ),
          averageRating: { $round: ["$averageRating", 2] },
          totalReviews: 1
        }
      }
    ]
  },
  revenueByCategory: {
    title: "Revenue by Product Category",
    insight:
      "Aggregates item-level revenue by product category and uses the translation table for easier presentation.",
    collection: COLLECTIONS.orderItems,
    buildPipeline: () => [
      {
        $lookup: {
          from: COLLECTIONS.products,
          localField: getField(ENTITY.orderItems, "productId"),
          foreignField: getField(ENTITY.products, "id"),
          as: "product"
        }
      },
      { $unwind: "$product" },
      {
        $lookup: {
          from: COLLECTIONS.categoryTranslations,
          localField: `product.${getField(ENTITY.products, "categoryName")}`,
          foreignField: getField(ENTITY.categoryTranslations, "categoryName"),
          as: "translation"
        }
      },
      {
        $group: {
          _id: `$product.${getField(ENTITY.products, "categoryName")}`,
          categoryEnglish: {
            $first: lookupFirstValue(
              "translation",
              getField(ENTITY.categoryTranslations, "categoryEnglishName")
            )
          },
          totalRevenue: { $sum: revenueExpression() },
          totalUnits: { $sum: 1 }
        }
      },
      { $sort: { totalRevenue: -1 } },
      {
        $project: {
          _id: 0,
          category: "$_id",
          categoryEnglish: 1,
          totalRevenue: { $round: ["$totalRevenue", 2] },
          totalUnits: 1
        }
      }
    ]
  },
  repeatCustomers: {
    title: "Repeat Customer Identification",
    insight:
      "Finds returning shoppers using customer_unique_id, which is the stable customer identifier in the Olist dataset.",
    collection: COLLECTIONS.orders,
    buildPipeline: () => [
      {
        $lookup: {
          from: COLLECTIONS.customers,
          localField: getField(ENTITY.orders, "customerId"),
          foreignField: getField(ENTITY.customers, "id"),
          as: "customer"
        }
      },
      { $unwind: "$customer" },
      {
        $lookup: {
          from: COLLECTIONS.orderItems,
          localField: getField(ENTITY.orders, "id"),
          foreignField: getField(ENTITY.orderItems, "orderId"),
          as: "items"
        }
      },
      {
        $addFields: {
          orderRevenue: {
            $sum: {
              $map: {
                input: "$items",
                as: "item",
                in: itemVariableRevenueExpression("item")
              }
            }
          }
        }
      },
      {
        $group: {
          _id: `$customer.${getField(ENTITY.customers, "uniqueId")}`,
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: "$orderRevenue" },
          customerCity: { $first: `$customer.${getField(ENTITY.customers, "city")}` },
          customerState: { $first: `$customer.${getField(ENTITY.customers, "state")}` }
        }
      },
      { $match: { totalOrders: { $gte: 2 } } },
      { $sort: { totalOrders: -1, totalSpent: -1 } },
      { $limit: 20 },
      {
        $project: {
          _id: 0,
          customerUniqueId: "$_id",
          customerCity: 1,
          customerState: 1,
          totalOrders: 1,
          totalSpent: { $round: ["$totalSpent", 2] }
        }
      }
    ]
  },
  deliveryPerformance: {
    title: "Order Delivery Performance",
    insight:
      "Evaluates average delivery days and estimated delay using the delivery timestamps available in the orders collection.",
    collection: COLLECTIONS.orders,
    buildPipeline: () => [
      {
        $match: {
          [getField(ENTITY.orders, "deliveredTimestamp")]: { $ne: null },
          [getField(ENTITY.orders, "purchaseTimestamp")]: { $ne: null },
          [getField(ENTITY.orders, "estimatedDeliveryDate")]: { $ne: null }
        }
      },
      {
        $project: {
          orderStatus: fieldPath(ENTITY.orders, "status"),
          deliveryDays: {
            $dateDiff: {
              startDate: fieldPath(ENTITY.orders, "purchaseTimestamp"),
              endDate: fieldPath(ENTITY.orders, "deliveredTimestamp"),
              unit: "day"
            }
          },
          estimatedDelayDays: {
            $dateDiff: {
              startDate: fieldPath(ENTITY.orders, "estimatedDeliveryDate"),
              endDate: fieldPath(ENTITY.orders, "deliveredTimestamp"),
              unit: "day"
            }
          }
        }
      },
      {
        $group: {
          _id: "$orderStatus",
          averageDeliveryDays: { $avg: "$deliveryDays" },
          averageDelayDays: { $avg: "$estimatedDelayDays" },
          ordersMeasured: { $sum: 1 }
        }
      },
      { $sort: { averageDeliveryDays: 1 } },
      {
        $project: {
          _id: 0,
          orderStatus: "$_id",
          averageDeliveryDays: { $round: ["$averageDeliveryDays", 2] },
          averageDelayDays: { $round: ["$averageDelayDays", 2] },
          ordersMeasured: 1
        }
      }
    ]
  },
  reviewInsights: {
    title: "Customer Review Insights",
    insight:
      "Summarizes review scores and comment activity to show both rating distribution and how often buyers leave text feedback.",
    collection: COLLECTIONS.reviews,
    buildPipeline: () => [
      {
        $group: {
          _id: fieldPath(ENTITY.reviews, "score"),
          reviewCount: { $sum: 1 },
          withComment: {
            $sum: {
              $cond: [
                {
                  $gt: [
                    {
                      $strLenCP: {
                        $ifNull: [fieldPath(ENTITY.reviews, "comment"), ""]
                      }
                    },
                    0
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          reviewScore: "$_id",
          reviewCount: 1,
          withComment: 1
        }
      }
    ]
  }
};

function listQueries() {
  return Object.entries(queryDefinitions).map(([key, value]) => ({
    key,
    title: value.title,
    insight: value.insight
  }));
}

async function executeQuery(key) {
  const definition = queryDefinitions[key];

  if (!definition) {
    const error = new Error(`Unknown query key: ${key}`);
    error.statusCode = 404;
    throw error;
  }

  const db = await connectToDatabase();
  const pipeline = definition.buildPipeline();
  const results = await db.collection(definition.collection).aggregate(pipeline).toArray();

  return {
    key,
    title: definition.title,
    insight: definition.insight,
    collection: definition.collection,
    results
  };
}

module.exports = {
  listQueries,
  executeQuery
};
