# Trade

A React 19 + Vite trading dashboard built with Mantine, React Router, Zustand, React Query, Axios, React Hook Form, Zod, Big.js, and Lightweight Charts.

This project is a front-end application. It compiles into a static bundle and then loads live data from the SFL API and CoinGecko. Because of that, deployment is mostly about building the app correctly and making sure the public site can still reach the data endpoints.

## Local development

```bash
npm install
npm run dev
```

Then open the local URL shown in the terminal, usually:

```text
http://localhost:5173
```

## Production build

This app is built as a static site with Vite.

```bash
npm install
npm run build
```

This creates a production bundle in the `dist/` folder.

To preview the production build locally:

```bash
npm run preview -- --host 0.0.0.0
```

## Deployment guide

### 1. Understand the app type

This is a client-side React app. There is no Node server running in production for the UI itself. The browser loads the built static files and then fetches JSON and CSV data from the trade API.

Important files:

- `src/api/resources.api.js` contains API requests.
- `vite.config.js` configures the local dev proxy.
- `dist/` is the deployable production output after `npm run build`.

### 2. Build the app

Run this from the project root:

```bash
npm install
npm run build
```

If the command succeeds, Vite generates the deployable output in:

```text
dist/
```

### 3. Deploy the static output

The simplest deployment pattern is:

- Build command: `npm run build`
- Publish directory: `dist`

This works with most static hosts such as:

- Vercel
- Netlify
- Cloudflare Pages
- GitHub Pages
- any traditional static web server or CDN

Example deployment flow for a static host:

```bash
npm install
npm run build
```

Then upload the contents of `dist/` to your hosting provider.

### 4. Hosting requirements for the app data

The app expects API traffic at `/api/v1/trade`.

The relevant fetch calls are in `src/api/resources.api.js`:

```js
const API_URL = "/api/v1/trade";
```

During local development, the app proxies requests through Vite using `vite.config.js`:

```js
server: {
  proxy: {
    "/api": {
      target: "https://sfl.world",
      changeOrigin: true,
    },
  },
}
```

This is only for development. In production, your hosting setup must still allow the app to reach the same API path.

You have two common production options:

1. Serve the app and the API behind the same domain or a reverse proxy.
2. Update the API URLs to match your production backend host.

If the deployed site is not behind a proxy that handles `/api`, the dashboard will fail to load trade data even though the front-end itself builds successfully.

### 5. Production checklist

Before shipping, confirm the following:

- `npm run build` succeeds.
- The site loads without JavaScript errors.
- The chart and data requests resolve successfully.
- `/api` requests reach the backend host.
- The base URL or custom domain is configured correctly.
- Assets are served from the correct public path.

### 6. Example deployment commands

For a standard static deployment:

```bash
npm install
npm run build
npm run preview -- --host 0.0.0.0
```

For a server with static files served directly:

```bash
npm install
npm run build
scp -r dist/* user@server:/var/www/your-site/
```

### 7. Project structure

```text
trade
├─ eslint.config.js
├─ index.html
├─ jsconfig.json
├─ package.json
├─ vite.config.js
├─ src
│  ├─ App.jsx
│  ├─ Pages
│  │  ├─ 404.jsx
│  │  ├─ Home.jsx
│  │  └─ Loading.jsx
│  ├─ Routes
│  │  └─ routes.jsx
│  ├─ api
│  │  └─ resources.api.js
│  ├─ assets
│  │  └─ image_paths.json
│  ├─ components
│  │  ├─ common
│  │  │  ├─ ResourceSelect.jsx
│  │  │  └─ charts
│  │  │     ├─ ChartLegend.jsx
│  │  │     ├─ PriceChart.css
│  │  │     └─ PriceChart.jsx
│  ├─ hooks
│  │  └─ useResources.query.js
│  ├─ layouts
│  │  ├─ Body.jsx
│  │  ├─ Footer.css
│  │  ├─ Footer.jsx
│  │  └─ Headers.jsx
│  ├─ main.jsx
│  ├─ services
│  │  ├─ FormatData.js
│  │  ├─ FormatTime.js
│  │  ├─ Season.js
│  │  └─ search.js
│  ├─ styles
│  │  └─ chart.style.js
│  └─ utils
└─ dist
```

## Quick summary

If you want the shortest possible deployment path:

```bash
npm install
npm run build
```

Then deploy the generated `dist/` folder to your static host and confirm the site can still access `/api` in production.
