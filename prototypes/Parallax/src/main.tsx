import { createRoot } from "react-dom/client";

import { HeroPlaygroundPage } from "./HeroPlaygroundPage";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Parallax root element is missing.");
}

createRoot(root).render(<HeroPlaygroundPage />);
