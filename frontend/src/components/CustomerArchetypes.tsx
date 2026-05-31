export default function CustomerArchetypes({ items }: any) {
  if (!items?.length) return null;

  return (
    <div className="feature-card">
      <div className="feature-title">
        👥 Shopper Personas
      </div>

      {items.map((p:any)=>(
        <div key={p.archetype}>
          {p.archetype} — {p.percentage}%
        </div>
      ))}
    </div>
  );
}
