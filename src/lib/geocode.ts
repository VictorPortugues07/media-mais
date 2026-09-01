const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

interface GeoResult {
  lat: number;
  lng: number;
}

const cache = new Map<string, GeoResult | null>();

export async function geocodeAddress(
  rua: string,
  numero: string,
  bairro: string,
  cidade: string,
  uf: string
): Promise<GeoResult | null> {
  const address = `${rua}, ${numero}, ${bairro}, ${cidade}, ${uf}, Brasil`;
  
  if (cache.has(address)) return cache.get(address) || null;

  try {
    const params = new URLSearchParams({
      q: address,
      format: "json",
      limit: "1",
      countrycodes: "br",
    });

    const res = await fetch(`${NOMINATIM_URL}?${params}`, {
      headers: { "User-Agent": "MediaMais/1.0" },
    });

    const data = await res.json();

    if (data.length > 0) {
      const result: GeoResult = {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      };
      cache.set(address, result);
      return result;
    }

    cache.set(address, null);
    return null;
  } catch {
    return null;
  }
}
