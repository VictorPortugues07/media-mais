"use client";

import React, { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";

export interface PontoMapItem {
  id: number;
  nomeEmpresa: string;
  categoria: string;
  cidade: string;
  uf: string;
  bairro: string;
  rua: string;
  numero: string;
  fluxoDiarioEstimado: string;
  tempoPermanencia: string;
  faixaEtariaPublico: string[];
  fotos?: string[];
  lat?: number | null;
  lng?: number | null;
  user?: {
    nome?: string;
    avatarUrl?: string | null;
  };
  _count?: {
    anuncios: number;
  };
}

interface PointsMapProps {
  pontos: PontoMapItem[];
  selectedPontoId?: number | null;
  onSelectPonto: (ponto: PontoMapItem) => void;
}

export default function PointsMap({
  pontos,
  selectedPontoId,
  onSelectPonto,
}: PointsMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<any[]>([]);
  const [isReady, setIsReady] = useState(false);

  // Garante que o container está montado e tem dimensões antes de inicializar o Leaflet
  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isReady) return;

    let isMounted = true;

    async function initMap() {
      if (!mapContainerRef.current) return;

      // Se já existe instância, apenas invalida o tamanho (garante re-render correto)
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
        return;
      }

      const L = await import("leaflet");
      if (!isMounted || !mapContainerRef.current) return;

      const defaultCenter: [number, number] = [-27.5954, -48.548]; // Florianópolis

      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: 12,
        scrollWheelZoom: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;

      // invalidateSize após tiles carregarem — corrige o bug de mapa cinza na primeira visita
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 200);

      updateMarkers(L, map);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function updateMarkers(L: any, map: any) {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      const validPontos = pontos.filter((p) => p.lat && p.lng);

      if (validPontos.length === 0) return;

      const bounds: [number, number][] = [];

      validPontos.forEach((ponto) => {
        const isSelected = ponto.id === selectedPontoId;
        const avatarImage =
          ponto.fotos && ponto.fotos.length > 0
            ? ponto.fotos[0]
            : ponto.user?.avatarUrl;

        const size = isSelected ? 44 : 36;
        const customIcon = L.divIcon({
          className: "custom-div-icon",
          html: avatarImage
            ? `<div style="
                width:${size}px;height:${size}px;border-radius:50%;
                border:${isSelected ? "3px solid #2563eb" : "2px solid white"};
                box-shadow:0 4px 14px rgba(0,0,0,0.35);
                background-image:url('${avatarImage}');
                background-size:cover;background-position:center;
                cursor:pointer;transition:all .2s ease;">
              </div>`
            : `<div style="
                background:${isSelected ? "linear-gradient(135deg,#1d4ed8,#2563eb)" : "#2563eb"};
                width:${isSelected ? 38 : 30}px;height:${isSelected ? 38 : 30}px;
                border-radius:50%;border:3px solid white;
                box-shadow:0 4px 14px rgba(37,99,235,0.4);
                display:flex;align-items:center;justify-content:center;
                color:white;font-size:${isSelected ? 16 : 13}px;
                cursor:pointer;transition:all .2s ease;">📺</div>`,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });

        const marker = L.marker([ponto.lat!, ponto.lng!], { icon: customIcon })
          .addTo(map)
          .on("click", () => {
            onSelectPonto(ponto);
          });

        marker.bindPopup(`
          <div style="font-family:sans-serif;padding:4px;min-width:180px;">
            <strong style="font-size:14px;color:#0f172a;display:block;margin-bottom:4px;">${ponto.nomeEmpresa}</strong>
            <span style="font-size:11px;background:#eff6ff;color:#1d4ed8;padding:2px 8px;border-radius:4px;font-weight:600;">${ponto.categoria}</span>
            <div style="font-size:12px;color:#64748b;margin-top:8px;line-height:1.6;">
              📍 ${ponto.bairro}, ${ponto.cidade} – ${ponto.uf}<br/>
              👥 Fluxo: <b>${ponto.fluxoDiarioEstimado}</b><br/>
              ⏱️ Permanência: <b>${ponto.tempoPermanencia}</b>
            </div>
          </div>
        `);

        markersRef.current.push(marker);
        bounds.push([ponto.lat!, ponto.lng!]);
      });

      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
      }
    }

    if (!mapInstanceRef.current) {
      initMap();
    } else {
      import("leaflet").then((L) => {
        if (isMounted && mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
          updateMarkers(L, mapInstanceRef.current);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [isReady, pontos, selectedPontoId, onSelectPonto]);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className="w-full h-full min-h-[500px] rounded-2xl overflow-hidden shadow-sm border border-slate-200/80 relative z-0 bg-slate-100">
      <div ref={mapContainerRef} className="w-full h-full min-h-[500px]" />
    </div>
  );
}
