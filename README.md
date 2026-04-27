# GHC Academy - Premium Sports Training Platform

A modern educational platform for sports training courses with cart/checkout functionality and dual-role dashboard system.

## Features

- **Public Store**: Browse and purchase courses without login
- **Shopping Cart**: Add courses and complete checkout (no authentication required)
- **Student Dashboard**: Track enrolled courses and progress
- **Admin Dashboard**: View metrics and manage platform
- **Responsive Design**: Works on all devices

## Installation

1. **Install dependencies:**
```bash
npm install
```

## Development

**Run the development server:**
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Build

**Create a production build:**
```bash
npm run build
```

**Preview the production build:**
```bash
npm run preview
```

## Deployment to Vercel

1. Push your code to a GitHub repository
2. Connect your repo to Vercel
3. Configure build settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Deploy!

## Logo Setup

Place your `logo-limpio.png` file in the `public/` directory at the project root. The app references it as `/logo-limpio.png`.

If the logo file is missing, the app will still function but show a broken image icon in the header.

## Usage

### Store
- Browse available courses
- Click "Buy Now" to add to cart and navigate to checkout
- No login required to purchase

### Cart/Checkout
- Review selected courses
- Remove items if needed
- Click "Confirm Purchase" to complete order (no login required)
- You'll be returned to the store with a success message

### Login (Optional - for Dashboards)
- **Student Access**: Always visible - view course progress
- **Administrator Access**: Only visible when URL contains `?admin=1` - view platform metrics

To access admin login: navigate to `http://localhost:5173/?admin=1`

### Demo Credentials
No actual credentials required - this is a demo UI. Click any login option to explore the respective dashboard.

## Tech Stack

- **React 18** - UI framework
- **Vite 5** - Build tool and dev server
- **Framer Motion** - Animations
- **Lucide React** - Icon library

## Project Structure
