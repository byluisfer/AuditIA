export function Scanlines() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-50"
      style={{
        backgroundImage:
          "repeating-linear-gradient(0deg, transparent 0px, transparent 1px, var(--scanline-color) 1px, var(--scanline-color) 2px)",
      }}
    />
  );
}

export function Vignette() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-40"
      style={{
        background:
          "radial-gradient(ellipse at center, transparent 40%, var(--vignette-color) 100%)",
      }}
    />
  );
}
