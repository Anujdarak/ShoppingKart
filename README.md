# ShoppingKart

## Deploy to Vercel

1. Import this repository in Vercel. Vercel uses `vercel.json` to build the React app and route the Express API as a serverless function.
2. Add these environment variables in the Vercel project settings for the environments you will deploy:
   - `MONGO_URI` — MongoDB connection string. Configure Atlas network access to allow Vercel connections.
   - `JWT_SECRET` — a strong, private signing secret.
   - `RAZORPAY_KEY_ID` — Razorpay key ID.
   - `RAZORPAY_KEY_SECRET` — Razorpay key secret.
3. Deploy. The frontend and API share the same domain, so no `VITE_API_URL` is needed.

Keep local `.env` files out of Git and enter deployment secrets in Vercel's environment-variable settings instead.
