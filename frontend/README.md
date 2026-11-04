# Attendance System Frontend

Vue 3 client for the Student Attendance Management System. For the full system overview, backend setup, environment configuration, and security notes, see the [root README](../README.md).

## Development

From this directory, install dependencies and start Vite:

```bash
npm install
npm run dev
```

The Vite development server proxies `/api` and `/socket.io` to `http://localhost:5001`. Configure the backend to use port `5001`, or update the proxy in `vite.config.js` to match the backend port.

## Production Build

```bash
npm run build
npm run preview
```

The production build generates the web manifest and service worker. It precaches the static app shell; authenticated API workflows still require a network connection.
