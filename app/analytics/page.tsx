import { Scanlines, Vignette } from "../components/overlays";
import { Sidebar } from "../components/sidebar";
import { Footer } from "../components/footer";

export default function Analytics() {
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
      <Sidebar />
      <main
        className="flex flex-col items-center justify-center min-h-screen px-12 lg:px-24"
        style={{
          marginLeft: "var(--sidebar-w, 15rem)",
          transition: "margin-left 0.2s ease",
        }}
      />
      <Footer />
    </div>
  );
}
