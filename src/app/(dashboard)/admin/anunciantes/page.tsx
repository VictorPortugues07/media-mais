"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";

export default function AdminAnunciantesPage() {
  const [user, setUser] = useState<any>(null);
  const [anunciantes, setAnunciantes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [uRes, aRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/anunciantes"),
        ]);
        if (uRes.ok) setUser((await uRes.json()).user);
        if (aRes.ok) setAnunciantes((await aRes.json()).anunciantes || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <DashboardLayout
      role="ADMIN"
      userName={user?.nome || "Administrador"}
      userEmail={user?.email || ""}
      title="Empresas Anunciantes"
      description="Marcas e comércios cadastrados para veiculação de mídia"
    >
      <Card>
        <CardHeader>
          <h3 className="font-bold text-slate-900 font-heading">
            Total de {anunciantes.length} Anunciante(s)
          </h3>
        </CardHeader>
        <CardBody className="p-0">
          <div className="divide-y divide-slate-200">
            {anunciantes.map((anu) => (
              <div key={anu.id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 text-sm">{anu.nomeEmpresa}</h4>
                    <Badge variant="brand">{anu.categoria}</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Contato: {anu.responsavel} • WhatsApp: {anu.whatsapp}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    📍 {anu.cidade}/{anu.uf} • Foco: {anu.oQueAnunciar}
                  </p>
                </div>
                <div className="text-xs text-slate-400 font-semibold">
                  {anu._count?.anuncios || 0} campanha(s)
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </DashboardLayout>
  );
}
