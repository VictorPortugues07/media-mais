"use client";

import React, { useEffect, useRef } from "react";
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
  lat?: number | null;
  lng?: number | null;
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

  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!mapContainerRef.current || mapInstanceRef.current) return;

      const L = await import("leaflet");

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

        const customIcon = L.divIcon({
          className: "custom-div-icon",
          html: `<div style="
            background: ${isSelected ? "linear-gradient(135deg, #1d4ed8, #2563eb)" : "#2563eb"};
            width: ${isSelected ? "38px" : "30px"};
            height: ${isSelected ? "38px" : "30px"};
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: ${isSelected ? "16px" : "13px"};
            cursor: pointer;
            transition: all 0.2s ease;
          ">📺</div>`,
          iconSize: [isSelected ? 38 : 30, isSelected ? 38 : 30],
          iconAnchor: [isSelected ? 19 : 15, isSelected ? 19 : 15],
        });

        const marker = L.marker([ponto.lat!, ponto.lng!], { icon: customIcon })
          .addTo(map)
          .on("click", () => {
            onSelectPonto(ponto);
          });

        marker.bindPopup(`
          <div style="font-family: var(--font-inter, sans-serif); padding: 4px;">
            <strong style="font-size: 14px; color: #0f172a; display: block; margin-bottom: 2px;">${ponto.nomeEmpresa}</strong>
            <span style="font-size: 11px; background: #eff6ff; color: #1d4ed8; padding: 2px 6px; border-radius: 4px; font-weight: 600;">${ponto.categoria}</span>
            <div style="font-size: 12px; color: #64748b; margin-top: 6px; line-height: 1.4;">
              📍 ${ponto.bairro}, ${ponto.cidade} - ${ponto.uf}<br/>
              👥 Fluxo: <b>${ponto.fluxoDiarioEstimado}</b><br/>
              ⏱️ Tempo médio: <b>${ponto.tempoPermanencia}</b>
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
          updateMarkers(L, mapInstanceRef.current);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [pontos, selectedPontoId, onSelectPonto]);

  return (
    <div className="w-full h-full min-h-[450px] rounded-2xl overflow-hidden shadow-xs border border-slate-200/80 relative z-0">
      <div ref={mapContainerRef} className="w-full h-full min-h-[450px]" />
    </div>
  );
}
