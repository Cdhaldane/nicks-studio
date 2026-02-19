# Deployment Guide for Vercel

## Overview

This project is now configured to deploy both the React frontend and Square API backend as a single application on Vercel using serverless functions.

## Project Structure

```
nicks-studio-shopify/
├── api/                          # Serverless functions (backend)
│   ├── _utils.js                # Shared utilities
│   ├── health.js                # GET /api/health
│   ├── square-catalog-items.js  # GET /api/square-catalog-items
│   ├── square-catalog-item.js   # GET /api/square-catalog-item?id={id}
│   ├── square-catalog-category.js  # GET /api/square-catalog-category?id={id}
│   ├── square-catalog-image.js  # GET /api/square-catalog-image?id={id}
│   ├── square-checkout.js       # POST /api/square-checkout
│   ├── square-payment-link.js   # POST /api/square-payment-link
│   ├── square-process-payment.js  # POST /api/square-process-payment
│   ├── square-order.js          # GET /api/square-order?id={id}
│   └── package.json
├── src/                         # React frontend
├── build/                       # Production build output
├── vercel.json                  # Vercel configuration
└── package.json                 # Root dependencies
```

## Deployment Steps

### 1. Install Vercel CLI (Optional)

```bash
npm install -g vercel
```

### 2. Configure Environment Variables

In your Vercel project settings (or via `.env` for local testing), set:

**Frontend Variables:**

- `REACT_APP_SQUARE_APPLICATION_ID` - Your Square Application ID
- `REACT_APP_SQUARE_LOCATION_ID` - Your Square Location ID
- `REACT_APP_SQUARE_ENVIRONMENT` - "sandbox" or "production"

**Backend Variables:**

- `SQUARE_ACCESS_TOKEN` - Your Square Access Token (keep secret!)
- `SQUARE_LOCATION_ID` - Your Square Location ID
- `SQUARE_ENVIRONMENT` - "sandbox" or "production"
- `FRONTEND_URL` - Your frontend URL (e.g., https://nickolamagnolia.com)

### 3. Deploy via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click "Import Project"
3. Connect your GitHub repository
4. Set the root directory to: `nicks-studio-shopify`
5. Add all environment variables
6. Click "Deploy"

### 4. Deploy via CLI

```bash
cd nicks-studio-shopify
vercel
```

Follow the prompts to configure your project.

## API Endpoints

All API endpoints are accessible at `/api/*`:

- **GET** `/api/health` - Health check
- **GET** `/api/square-catalog-items` - Get all catalog items
- **GET** `/api/square-catalog-item?id={id}` - Get single item
- **GET** `/api/square-catalog-category?id={id}` - Get items by category
- **GET** `/api/square-catalog-image?id={id}` - Get image URL
- **POST** `/api/square-checkout` - Create checkout session
- **POST** `/api/square-payment-link` - Create payment link
- **POST** `/api/square-process-payment` - Process payment
- **GET** `/api/square-order?id={id}` - Get order details

## Local Testing

1. Install dependencies:

```bash
npm install
cd api && npm install && cd ..
```

2. Create `.env` file with environment variables

3. Start development server:

```bash
vercel dev
```

This runs both frontend and serverless functions locally.

## Migrating from GitHub Pages

Since GitHub Pages can't run server code, you need to:

1. ✅ **Deploy to Vercel** (both frontend + backend together)
2. Update your DNS:
   - Point your domain to Vercel instead of GitHub Pages
   - In Vercel dashboard, add your custom domain
   - Update DNS records as instructed by Vercel

## Benefits of This Setup

✅ Single deployment for frontend + backend  
✅ Automatic HTTPS and CDN  
✅ Serverless scaling (only pay for usage)  
✅ Environment variable management  
✅ Preview deployments for PRs  
✅ No server management needed

## Troubleshooting

**Build fails:** Check that all dependencies are in package.json  
**API returns 500:** Verify environment variables are set correctly  
**CORS errors:** Ensure FRONTEND_URL matches your actual domain

## Need Help?

- [Vercel Documentation](https://vercel.com/docs)
- [Square API Documentation](https://developer.squareup.com/docs)
