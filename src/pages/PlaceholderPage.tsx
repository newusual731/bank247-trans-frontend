export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div style={{ paddingTop: "0.5rem" }}>
      <h1 style={{ margin: 0, fontSize: "1.85rem", letterSpacing: "-0.03em" }}>{title}</h1>
      <p style={{ color: "#6b7280", marginTop: "0.75rem" }}>Coming next from the transaction processing Figma pack.</p>
    </div>
  );
}
