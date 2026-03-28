import { Scanlines, Vignette } from "./components/overlays";
import { Header } from "./components/header";
import { Sidebar } from "./components/sidebar";
import { HeroSection } from "./components/hero-section";
import { Footer } from "./components/footer";

export default function Home() {
  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: "var(--bg)",
        fontFamily: "var(--font-jetbrains-mono), monospace",
      }}
    >
      <Scanlines />
      <Vignette />
      <Header />
      <Sidebar />
      <HeroSection />
      <Footer />
    </div>
  );
}
