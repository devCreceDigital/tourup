"use client";

import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";

interface Props {
  query: string;
}

export default function ViajeMap({ query }: Props) {
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!query || query === "—") { setLoading(false); return; }
    fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`)
      .then(r => r.json())
      .then(data => {
        if (data?.[0]) setCoords({ lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [query]);

  if (loading) return <div className="h-36 bg-[#f0edf8] flex items-center justify-center text-[11px] text-[#aaa]">Cargando mapa…</div>;

  if (!coords) return (
    <div className="h-36 bg-[#f0edf8] flex items-center justify-center text-center p-4">
      <div>
        <MapPin className="h-6 w-6 text-[#AFA9EC] mx-auto mb-2" />
        <p className="text-[11px] text-[#aaa]">{query}</p>
      </div>
    </div>
  );

  const bbox = `${coords.lon - 0.4},${coords.lat - 0.3},${coords.lon + 0.4},${coords.lat + 0.3}`;

  return (
    <div className="h-36 overflow-hidden">
      <iframe
        width="100%"
        height="144"
        style={{ border: 0 }}
        loading="lazy"
        src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${coords.lat},${coords.lon}`}
      />
    </div>
  );
}
