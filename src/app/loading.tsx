export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="card h-40 animate-pulse" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="card h-24 animate-pulse" />
        ))}
      </div>
    </div>
  );
}
