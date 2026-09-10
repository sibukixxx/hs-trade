import { render } from "preact"
import { RouterProvider } from "@tanstack/react-router"
import { router } from "./router"
import "./index.css"

const root = document.getElementById("app")
if (!root) throw new Error("#app root element not found")

render(<RouterProvider router={router} />, root)
