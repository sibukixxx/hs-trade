import { createRootRoute, createRoute, createRouter, Outlet } from "@tanstack/react-router"
import { ClassifyPage } from "./routes/index"
import { DisclaimerBanner } from "./components/DisclaimerBanner"
import { BusinessInquiryNote } from "./components/BusinessInquiryNote"

// P0 is intentionally a single page (see design doc: "トップページからすぐ
// 分類を試せるようにしてください"). TanStack Router is wired up anyway per
// the project's technical direction, so adding e.g. a /history route later
// doesn't require restructuring the app.
const rootRoute = createRootRoute({
  component: () => (
    <div class="min-h-screen flex flex-col">
      <DisclaimerBanner />
      <div class="flex-1">
        <Outlet />
      </div>
      <footer class="border-t border-slate-200 py-4">
        <BusinessInquiryNote />
      </footer>
    </div>
  )
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: ClassifyPage
})

const routeTree = rootRoute.addChildren([indexRoute])

export const router = createRouter({ routeTree })

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}
