"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";

export default function AdminUsuariosPage() {
  const [user, setUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [uRes, listRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/admin/usuarios"),
        ]);
        if (uRes.ok) setUser((await uRes.json()).user);
        if (listRes.ok) setUsers((await listRes.json()).users || []);
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
      title="Controle de Usuários"
      description="Todos os acessos criados na plataforma"
    >
      <Card>
        <CardHeader>
          <h3 className="font-bold text-slate-900 font-heading">
            Total de {users.length} Usuário(s) Registrado(s)
          </h3>
        </CardHeader>
        <CardBody className="p-0">
          <div className="divide-y divide-slate-200">
            {users.map((u) => (
              <div key={u.id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 text-sm">{u.nome}</h4>
                    <Badge variant={u.role === "ADMIN" ? "danger" : u.role === "PONTO" ? "success" : "brand"}>
                      {u.role}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    E-mail: {u.email} • WhatsApp: {u.whatsapp}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Vinculado a: {u.pontoMidia?.nomeEmpresa || u.anunciante?.nomeEmpresa || "Acesso Direto"}
                  </p>
                </div>
                <div className="text-xs text-slate-400">
                  {new Date(u.criadoEm).toLocaleDateString("pt-BR")}
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </DashboardLayout>
  );
}
