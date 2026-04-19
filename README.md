# AI-Based E-Commerce Data Analysis System

This project is now adapted for the Kaggle Olist Brazilian e-commerce dataset using MongoDB, Node.js, Express, HTML, CSS, and JavaScript.

## Project location

Your project files are saved here:

[C:\Users\bhagy\Documents\Codex\2026-04-19-ai-based-e-commerce-data-analysis-2](</C:/Users/bhagy/Documents/Codex/2026-04-19-ai-based-e-commerce-data-analysis-2>)

Your CSV dataset files remain in their original folder:

`C:\Users\bhagy\OneDrive\Desktop\6 SEM\BDA Project\archive (3)\`

## What is included

- Express backend with MongoDB connection support
- 10 predefined MongoDB aggregation query modules
- Presentation-friendly dashboard with one-click query execution
- Dynamic result rendering as both table output and raw JSON
- Olist-specific schema mapping and collection configuration
- CSV import script already configured for your local Olist files

## Project structure

```text
.
|-- data/
|   `-- import-config.example.json
|-- docs/
|   `-- dataset-import.md
|-- public/
|   |-- app.js
|   |-- index.html
|   `-- styles.css
|-- scripts/
|   `-- importCsvToMongo.js
|-- src/
|   |-- config/
|   |   |-- dataset.js
|   |   `-- db.js
|   |-- routes/
|   |   `-- analyticsRoutes.js
|   |-- services/
|   |   `-- analyticsService.js
|   `-- server.js
|-- .env.example
|-- package.json
`-- README.md
```

## Olist collections used

- `customers`
- `geolocation`
- `order_items`
- `order_payments`
- `order_reviews`
- `orders`
- `products`
- `sellers`
- `category_translations`

The collection and field mapping is defined in [src/config/dataset.js](/C:/Users/bhagy/Documents/Codex/2026-04-19-ai-based-e-commerce-data-analysis-2/src/config/dataset.js).

## Analytics included

1. Top customers by purchase frequency
2. Most sold products
3. Monthly sales trends
4. Payment method distribution
5. Regional order distribution
6. Product rating analysis
7. Revenue by product category
8. Repeat customer identification
9. Order delivery performance
10. Customer review insights

## Important Olist notes

- Olist does not include customer names, so the dashboard uses `customer_unique_id`, city, and state.
- Sales revenue is calculated from `order_items.price + order_items.freight_value`.
- Product-level rating analysis is inferred by joining order reviews to the products inside each reviewed order.
- Category names can be shown in English using the translation file.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create your environment file:

```bash
copy .env.example .env
```

3. Update `.env` with your MongoDB connection details.

4. Import the Olist CSV files into MongoDB:

```bash
npm run import:data
```

5. Start the application:

```bash
npm run dev
```

6. Open `http://localhost:3000`

## Deploy on Render

This project includes a Render blueprint at [render.yaml](/C:/Users/bhagy/Documents/Codex/2026-04-19-ai-based-e-commerce-data-analysis-2/render.yaml).

Important:

- Render can deploy the Node.js web app, but it cannot use your local MongoDB at `mongodb://127.0.0.1:27017`.
- For deployment, you need a remote MongoDB database.
- The simplest options are MongoDB Atlas or a MongoDB service hosted on Render.

Recommended Render web service settings:

- Build Command: `npm install`
- Start Command: `npm start`
- Health Check Path: `/api/health`
- Environment Variable `MONGODB_URI`: your remote MongoDB connection string
- Environment Variable `MONGODB_DB`: `ecommerce_analysis`

After your remote MongoDB is ready, import the Olist data into that database before testing the deployed app.

## Next recommended steps

- Install dependencies and run the importer
- Start MongoDB locally and set the correct `.env` values
- Add charts for presentation storytelling
- Add filters such as date range, state, category, and payment type
- Add indexes for better performance on large collections
