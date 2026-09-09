import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts", "packages/**/*.test.ts", "eval/**/*.test.ts"],
    environment: "node"
  }
})
