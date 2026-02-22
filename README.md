# Paradigma Front — Telegram Mini App (Frontend)

A React (CRA) frontend for the **Paradigma** Telegram Mini App: product catalog, product pages, cart, checkout (pickup / CDEK pickup points / CDEK courier), profile, support, and order tracking.

> Router: **HashRouter** (`/#/route`) — works well for Telegram WebView and static hosting.

---

## Features

- **Catalog & product pages** (data sourced from `src/data/products.js`)
- **Cart**
  - Local state + persistence
  - Server sync by Telegram user id (when available)
- **Checkout**
  - Pickup
  - **CDEK Pickup Point (PVZ)**: list / map modes
  - **CDEK Courier (Door)**: manual address / map mode
  - Delivery price calculation via backend
- **Orders**
  - My orders list
  - Order details
  - Status timeline
  - Cancel order
- **Profile**
  - Phone / gender (loaded & saved via backend)
- **Support**
  - Submit a request to the backend
- **Age Gate (18+)**
  - Shown on first run, then once a week (configurable)
- **Preloader**
  - Fullscreen video overlay (`/public/assets/video/Preloader.mp4`)
- **Auto-reload on new version**
  - Compares `public/version.json` with `BUILD_VERSION` in `src/App.jsx`

---

## Tech Stack

- React 18 + Create React App
- `react-router-dom` (HashRouter)
- `styled-components`
- Telegram WebApp JS (`telegram-web-app.js`) + header `X-Telegram-Init-Data`
- CDEK widget: `@cdek-it/widget`
- Embla Carousel: `embla-carousel-react`
- Icons: `lucide-react`

---

## Requirements

- Node.js **16+** (recommended 18+)
- npm (or yarn)

---

## Getting Started

```bash
npm install
npm start
```

App will run at `http://localhost:3000`.

> Many flows work only inside Telegram (because user id + `initData` come from `window.Telegram.WebApp`).
> For testing in Telegram you usually need an **HTTPS** URL (ngrok / Cloudflare Tunnel, etc.).

---

## Environment Variables

Create a `.env` file in the project root:

```env
REACT_APP_API_BASE=https://your-backend.example.com
REACT_APP_YMAPS_API_KEY=your_yandex_maps_api_key
```

### Notes
- CRA exposes only vars prefixed with `REACT_APP_`.
- `REACT_APP_YMAPS_API_KEY` is injected into `public/index.html` at **build time**.
  After changing `.env`, restart the dev server.

---

## Backend Expectations (API)

The frontend talks to the backend defined by `REACT_APP_API_BASE`.
Most Telegram-authenticated requests include the header:

- `X-Telegram-Init-Data: <Telegram initData>`

Endpoints used in the codebase include:

### Users
- `POST /api/users/ensure` — ensure/create user on backend (called once on app start)

### Cart
- `POST /api/cart/update` — delta or set quantity
- `GET  /api/cart/sync?tg_user_id=...` — fetch cart
- `DELETE /api/cart` — clear cart (used in some flows)

### Orders
- `POST /api/orders` — create order
- `GET  /api/orders/my-orders?tg_user_id=...` — list user orders
- `GET  /api/orders/:id` — order details
- `GET  /api/orders/:id/timeline` — status timeline
- `POST /api/orders/:id/cancel` — cancel

### Profile & Support
- `GET  /api/profile`
- `POST /api/profile`
- `POST /api/support`

### Delivery (CDEK)
- `GET /api/delivery/cdek/cities?query=...`
- `GET /api/delivery/cdek/pvz?...`
- `GET /api/delivery/cdek/calc?delivery_type=...`
- `GET /api/cdek-widget/service` — service path for the CDEK widget

> Some pages contain a hardcoded fallback `API_BASE`. For production, set `REACT_APP_API_BASE` and consider removing fallbacks.

---

## Project Structure

- `public/`
  - `assets/` — images, videos, icons
  - `privacy.html`, `consent.html` — static documents
  - `version.json` — frontend version for auto-update
  - `index.html` — Telegram WebApp script + Yandex Maps script
- `src/`
  - `pages/` — routes (catalog/cart/checkout/orders/profile/support/etc.)
  - `components/` — UI components (TopBar, NavBar, AgeGate, etc.)
  - `context/CartContext.jsx` — cart state + server sync
  - `api/` — API helpers (cart/user)
  - `data/products.js` — product catalog + weight/dimensions for shipping calculations
  - `utils/`, `styles/`

---

## Build

```bash
npm run build
```

Outputs production files to `build/`.

---

## Deployment

### Static hosting
Serve the `build/` folder with any static server.

### Nginx (Timeweb Apps example)
This repo includes `nginx.conf` that:
- listens on **8080**
- serves `/app/build`
- sets headers to allow rendering inside Telegram WebView:
  - clears `X-Frame-Options`
  - adds `Content-Security-Policy: frame-ancestors ...telegram...`

If deploying elsewhere, copy the same headers into your server config.

---

## Versioning / Auto Update

The app periodically fetches `public/version.json` and reloads if the version differs from `BUILD_VERSION`.

Release checklist:
1. Update `BUILD_VERSION` in `src/App.jsx`
2. Update `public/version.json` to the same value
3. Build and deploy

---

## Troubleshooting

- **Blank screen inside Telegram**
  - Ensure the app is reachable via **HTTPS**
  - Ensure your server allows embedding (CSP `frame-ancestors` / no restrictive `X-Frame-Options`)
- **Yandex Maps / CDEK map not loading**
  - Check `REACT_APP_YMAPS_API_KEY` and its domain/referrer restrictions
  - Rebuild or restart dev server after changing `.env`
- **API errors**
  - Verify `REACT_APP_API_BASE`
  - Ensure backend accepts `X-Telegram-Init-Data` and correct CORS settings

---

## License

No license file is included in this repository yet. Add a `LICENSE` file if you plan to open-source it.
