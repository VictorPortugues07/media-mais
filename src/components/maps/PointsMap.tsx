"use client";

import React, { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import { escapeHtml, sanitizeCssUrl } from "@/lib/html-sanitize";

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
  aceitaNovosAnuncios?: boolean;
  tempoOcupadoSegundos?: number;
  tempoDisponivelSegundos?: number;
  limiteTempoSegundos?: number;
  porcentagemOcupada?: number;
  quantidadeFilaEspera?: number;
  maxCotas?: number;
  cotasOcupadas?: number;
  cotasDisponiveis?: number;
  tier?: string;
  cotaMensal?: number;
  scorePonderado?: number;
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
  const initialBoundsFittedRef = useRef(false);
  const prevPontosCountRef = useRef(0);
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

        const safeAvatar = sanitizeCssUrl(avatarImage);
        const safeNome = escapeHtml(ponto.nomeEmpresa);
        const safeCategoria = escapeHtml(ponto.categoria);
        const safeBairro = escapeHtml(ponto.bairro);
        const safeCidade = escapeHtml(ponto.cidade);
        const safeUf = escapeHtml(ponto.uf);
        const safeFluxo = escapeHtml(ponto.fluxoDiarioEstimado);
        const safePermanencia = escapeHtml(ponto.tempoPermanencia);

        const size = isSelected ? 44 : 36;
        const customIcon = L.divIcon({
          className: "custom-div-icon",
          html: safeAvatar
            ? `<div style="
                width:${size}px;height:${size}px;border-radius:50%;
                border:${isSelected ? "3px solid #4F93C9" : "2px solid white"};
                box-shadow:0 4px 14px rgba(0,0,0,0.35);
                background-image:url('${safeAvatar}');
                background-size:cover;background-position:center;
                cursor:pointer;transition:all .2s ease;">
              </div>`
            : `<div style="
                background:${isSelected ? "linear-gradient(135deg,#0E1F66,#4F93C9)" : "#4F93C9"};
                width:${isSelected ? 38 : 30}px;height:${isSelected ? 38 : 30}px;
                border-radius:50%;border:3px solid white;
                box-shadow:0 4px 14px rgba(79,147,201,0.4);
                display:flex;align-items:center;justify-content:center;
                color:white;cursor:pointer;transition:all .2s ease;">
                <svg style="width:${isSelected ? 18 : 14}px;height:${isSelected ? 18 : 14}px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>`,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });

        const marker = L.marker([ponto.lat!, ponto.lng!], { icon: customIcon })
          .addTo(map)
          .on("click", () => {
            onSelectPonto(ponto);
          });

        marker._pontoId = ponto.id;

        const safeTier = ponto.tier ? escapeHtml(ponto.tier) : "";
        const cotaFormatada = ponto.cotaMensal
          ? ponto.cotaMensal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
          : "";

        marker.bindPopup(`
          <div style="font-family:sans-serif;padding:4px;min-width:190px;">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:4px;margin-bottom:4px;">
              <strong style="font-size:14px;color:#0E1F66;">${safeNome}</strong>
              ${safeTier ? `<span style="font-size:10px;font-weight:800;padding:2px 6px;border-radius:6px;${safeTier === "Ouro" ? "background:#FEF3C7;color:#92400E;border:1px solid #FCD34D;" : safeTier === "Prata" ? "background:#F1F5F9;color:#334155;border:1px solid #CBD5E1;" : "background:#FFEDD5;color:#9A3412;border:1px solid #FDBA74;"}">${safeTier}</span>` : ""}
            </div>
            <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;margin-bottom:6px;">
              <span style="font-size:11px;background:#E0EEF8;color:#0E1F66;padding:2px 8px;border-radius:4px;font-weight:600;">${safeCategoria}</span>
              ${cotaFormatada ? `<strong style="font-size:12px;color:#1E4333;">${cotaFormatada}/mês</strong>` : ""}
            </div>
            <div style="font-size:12px;color:#344054;line-height:1.6;">
              Local: <b>${safeBairro}, ${safeCidade} – ${safeUf}</b><br/>
              Fluxo: <b>${safeFluxo}</b><br/>
              Permanência: <b>${safePermanencia}</b>
            </div>
          </div>
        `);

        if (isSelected) {
          setTimeout(() => {
            if (marker && map) {
              marker.openPopup();
            }
          }, 100);
        }

        markersRef.current.push(marker);
        bounds.push([ponto.lat!, ponto.lng!]);
      });

      // Só reajusta o enquadramento (fitBounds) na carga inicial ou se a lista de pontos mudar de tamanho
      const countChanged = prevPontosCountRef.current !== validPontos.length;
      prevPontosCountRef.current = validPontos.length;

      if (bounds.length > 0 && (!initialBoundsFittedRef.current || countChanged)) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
        initialBoundsFittedRef.current = true;
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
    <div className="w-full h-full min-h-[500px] rounded-2xl overflow-hidden shadow-xs border border-[#E4E7EC] relative z-0 bg-[#F7F8FA]">
      <div ref={mapContainerRef} className="w-full h-full min-h-[500px]" />
    </div>
  );
}
