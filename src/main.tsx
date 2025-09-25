
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n.js"; // Initialize i18n

import Lenis from "lenis";

const lenis = new Lenis({
	duration: 1.2, // slower, more premium feel
	easing: (t: number) => 1 - Math.pow(1 - t, 3), // cubic ease-out
		smoothWheel: true,
	touchMultiplier: 2,
	wheelMultiplier: 1,
	infinite: false,
});

function raf(time: number) {
	lenis.raf(time);
	requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

createRoot(document.getElementById("root")!).render(<App />);
