# ShoppingKart

ShoppingKart is a full-stack shopping application with a React storefront and an Express API backed by MongoDB. It includes product browsing, customer accounts, a cart, a wishlist, order history, and Razorpay checkout.

## Tech stack

- React, Vite, React Router, and Tailwind CSS
- Node.js and Express
- MongoDB with Mongoose
- JWT-based authentication with HTTP-only cookies
- Razorpay payments

## Features

- Browse and view products
- Register, log in, and manage a customer session
- Add products to a cart or wishlist
- Create payment orders and view order history

## Requirements

- Node.js 22.12 or newer
- npm
- A MongoDB database
- Razorpay API keys for payment functionality

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file in the project root and set the variables listed below.
3. Start the API in one terminal:

   ```bash
   npm run server
   ```

4. Start the frontend in a second terminal:

   ```bash
   npm run dev
   ```

   Open the local URL printed by Vite (usually `http://localhost:5173`). Vite proxies API requests to the backend on `http://127.0.0.1:3000`.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `MONGO_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret used to sign authentication tokens |
| `RAZORPAY_KEY_ID` | For payments | Razorpay key ID |
| `RAZORPAY_KEY_SECRET` | For payments | Razorpay key secret |
| `PORT` | No | Local backend port; defaults to `3000` |
| `VITE_API_URL` | No | API base URL when the frontend and API are hosted on separate origins; leave unset for the included same-origin/proxy setup |
| `PRODUCTS_API_URL` | No | Product source for `node seedProducts.js`; defaults to DummyJSON |

Never commit `.env` or put private credentials in frontend variables. Vite variables prefixed with `VITE_` are included in browser code and must not contain secrets.

## Seed products

With `MONGO_URI` configured, run:

```bash
node seedProducts.js
```

The script fetches sample products from DummyJSON and inserts them only when the products collection is empty. Set `PRODUCTS_API_URL` to use a different compatible product source.

## Production build

Build the frontend assets with:

```bash
npm run build
```

## API routes

- `/customers` — registration, login, profile, and logout
- `/products` — list products, view a product, and create a product
- `/wishlist` — get and update the customer wishlist
- `/cart` — get and update the customer cart
- `/orders` — create and verify payment, and manage order history

The health endpoint is `/`.

