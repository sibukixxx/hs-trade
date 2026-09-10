import { defineConfig } from "vite"
import preact from "@preact/preset-vite"

// @preact/preset-vite aliases react/react-dom to preact/compat, which is
// what lets us use @tanstack/react-router (a React-first library) here
// without pulling in React itself.
export default defineConfig({
  plugins: [preact()],
  server: {
    port: 5173
  }
})
