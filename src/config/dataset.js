const datasetConfig = {
  collections: {
    customers: "customers",
    geolocation: "geolocation",
    orderItems: "order_items",
    payments: "order_payments",
    reviews: "order_reviews",
    orders: "orders",
    products: "products",
    sellers: "sellers",
    categoryTranslations: "category_translations"
  },
  fields: {
    customers: {
      id: "customer_id",
      uniqueId: "customer_unique_id",
      zipCodePrefix: "customer_zip_code_prefix",
      city: "customer_city",
      state: "customer_state"
    },
    geolocation: {
      zipCodePrefix: "geolocation_zip_code_prefix",
      latitude: "geolocation_lat",
      longitude: "geolocation_lng",
      city: "geolocation_city",
      state: "geolocation_state"
    },
    orderItems: {
      orderId: "order_id",
      itemId: "order_item_id",
      productId: "product_id",
      sellerId: "seller_id",
      shippingLimitDate: "shipping_limit_date",
      price: "price",
      freightValue: "freight_value"
    },
    payments: {
      orderId: "order_id",
      sequential: "payment_sequential",
      paymentType: "payment_type",
      installments: "payment_installments",
      paymentValue: "payment_value"
    },
    reviews: {
      id: "review_id",
      orderId: "order_id",
      score: "review_score",
      commentTitle: "review_comment_title",
      comment: "review_comment_message",
      creationDate: "review_creation_date",
      answerTimestamp: "review_answer_timestamp"
    },
    orders: {
      id: "order_id",
      customerId: "customer_id",
      status: "order_status",
      purchaseTimestamp: "order_purchase_timestamp",
      approvedAt: "order_approved_at",
      deliveredCarrierDate: "order_delivered_carrier_date",
      deliveredTimestamp: "order_delivered_customer_date",
      estimatedDeliveryDate: "order_estimated_delivery_date"
    },
    products: {
      id: "product_id",
      categoryName: "product_category_name",
      nameLength: "product_name_lenght",
      descriptionLength: "product_description_lenght",
      photosQty: "product_photos_qty",
      weightG: "product_weight_g",
      lengthCm: "product_length_cm",
      heightCm: "product_height_cm",
      widthCm: "product_width_cm"
    },
    sellers: {
      id: "seller_id",
      zipCodePrefix: "seller_zip_code_prefix",
      city: "seller_city",
      state: "seller_state"
    },
    categoryTranslations: {
      categoryName: "product_category_name",
      categoryEnglishName: "product_category_name_english"
    }
  }
};

function getCollection(key) {
  return datasetConfig.collections[key];
}

function getField(group, key) {
  return datasetConfig.fields[group][key];
}

function fieldPath(group, key, prefix = "") {
  return `$${prefix}${getField(group, key)}`;
}

module.exports = {
  datasetConfig,
  getCollection,
  getField,
  fieldPath
};
