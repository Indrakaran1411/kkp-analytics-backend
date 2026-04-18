# KKP Textile Analytics Backend

This is the backend service for the **KKP Group — Textile Analytics Dashboard**. It is a single-file Express.js server that processes textile order data and serves actionable, algorithmic, and analytical insights via a robust JSON API.

## Features

This backend is designed not only to serve data but to provide business health scoring, performer extraction, and conversion analytics right inside the response. 

* `GET /api/overview` — High-level aggregation of primary KPIs with automated insight generation.
* `GET /api/orders` — Dynamic view of order-level metrics. Supports queries like `?status=Confirmed&agent=Suresh&weave=plain`.
* `GET /api/orders/status` — Confirmed / Processed / Declined breakdown with bottleneck indicators.
* `GET /api/orders/weave` — Weave preference & conversion analytics (revenue, quantity, confirmation rate).
* `GET /api/orders/quality` — Quality yield & revenue density.
* `GET /api/orders/composition` — Composition revenue grouping & popularity model.
* `GET /api/agents` — Agent performance ranking & conversion efficiency.
* `GET /api/agents/:name` — Single agent temporal profiling & cohort analysis.
* `GET /api/customers` — Customer activity scoring based on recency thresholds (Supports `?days=30` filter).
* `GET /api/weekly-trend` — 4-week rolling average trend & target velocity.
* `GET /api/funnel` — Multi-stage sales funnel drop-off analysis.
* `GET /api/analytics/momentum` — Month-over-month revenue momentum score with signal classification (Accelerating/Decelerating/Critical Drop).
* `GET /api/analytics/affinity-matrix` — Agent × Customer confirmation rate matrix with intelligent routing recommendations.
* `GET /api/analytics/rfm` — Customer loyalty segmentation using RFM (Recency, Frequency, Monetary) scoring.
* `GET /api/analytics/price-scatter` — Rate × Quantity correlation analysis to find pricing sweet spots.
* `GET /api/analytics/velocity-gaps` — Order gap anomaly detection.
* `GET /api/analytics/margin` — Margin estimator per composition.
* `GET /api/analytics/time-heatmap` — Day × Hour order submission heatmap.

## Tech Stack

* **Node.js**
* **Express.js**

## Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1. Navigate to the project directory.
2. Install the required dependencies:
   ```bash
   npm install
   ```

### Running the Server

Start the Node.js server by running:
```bash
node kkp_analytics_backend.js
```

The server will begin running at `http://localhost:3000`. You can visit `http://localhost:3000/` to get an overview of all the available routes and API health check.

## Project Structure

A simple, modular structure designed for scale and clarity:

* `kkp_analytics_backend.js`: The main application code and route layer. Houses all the filtering variables, algorithms, and simulated in-memory Data (can be easily replaced with an actual Database/API).
* `package.json`: Module dependencies & minimal project metadata.
