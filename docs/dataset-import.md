# Dataset Import Guide

This project is configured for the Kaggle Olist Brazilian e-commerce dataset.

## Current import config

The importer config at [data/import-config.example.json](/C:/Users/bhagy/Documents/Codex/2026-04-19-ai-based-e-commerce-data-analysis-2/data/import-config.example.json) already points to your dataset files in:

`C:\Users\bhagy\OneDrive\Desktop\6 SEM\BDA Project\archive (3)\`

## Collections imported

- `customers`
- `geolocation`
- `order_items`
- `order_payments`
- `order_reviews`
- `orders`
- `products`
- `sellers`
- `category_translations`

## Import command

After you create `.env` and set MongoDB details, run:

```bash
npm run import:data
```

## Type conversion handled by the importer

The importer converts important Olist fields automatically:

- numeric values like `price`, `freight_value`, `payment_value`, `review_score`
- date values like `order_purchase_timestamp`, `order_delivered_customer_date`, `review_answer_timestamp`

## Notes

- The CSV files are read from their original Desktop/OneDrive folder; they do not need to be copied into the project.
- If you move the CSV files later, update the paths in `data/import-config.example.json`.
- If you want to rename MongoDB collections, update both `data/import-config.example.json` and `src/config/dataset.js`.
