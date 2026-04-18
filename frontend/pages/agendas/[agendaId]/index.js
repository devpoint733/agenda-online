import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { api } from "../../../lib/api";
import AgendaLayout from "../../../components/layout/AgendaLayout";
import s from "../../../styles/pages.module.css";

export default function AgendaHomePage() {
  const router = useRouter();
  const { agendaId } = router.query;
  const { user, loading } = useAuth();
  const [agenda, setAgenda] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!agendaId) return;
    setError("");
    try {
      const row = await api(`/agendas/${agendaId}`);
      setAgenda(row);
    } catch (err) {
      setError(err.message || "Agenda não encontrada");
      setAgenda(null);
    }
  }, [agendaId]);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading || !user || !agendaId) {
    return (
      <AgendaLayout>
        <p className={s.muted}>Carregando…</p>
      </AgendaLayout>
    );
  }

  return (
    <AgendaLayout agendaTitle={agenda?.nome || "Agenda"}>
      <Head>
        <title>{agenda?.nome || "Agenda"}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>
      <h1 className={s.pageTitle}>Visão geral</h1>
      {error ? (
        <p className={s.error} role="alert">
          {error}
        </p>
      ) : null}
      {agenda ? (
        <div className={s.cardList}>
          <div className={s.card}>
            <p className={s.muted} style={{ margin: "0 0 8px" }}>
              Agenda
            </p>
            <strong style={{ fontSize: "1.125rem" }}>{agenda.nome}</strong>
            <p className={s.muted} style={{ margin: "8px 0 0" }}>
              Slug: {agenda.slug_agenda}
              {agenda.meu_papel ? ` · ${agenda.meu_papel === "proprietario" ? "Proprietário" : "Colaborador"}` : ""}
            </p>
          </div>
          <div className={s.card}>
            <p className={s.muted} style={{ margin: "0 0 12px" }}>
              Atalhos
            </p>
            <div className={s.formStack}>
              <Link href={`/agendas/${agendaId}/agendamentos`} className={s.btnPrimary}>
                Ver agendamentos
              </Link>
              <Link href={`/agendas/${agendaId}/clientes`} className={s.btnGhost}>
                Clientes
              </Link>
              <Link href={`/agendas/${agendaId}/servicos`} className={s.btnGhost}>
                Serviços
              </Link>
              <Link href={`/agendas/${agendaId}/configuracao`} className={s.btnGhost}>
                Ajustes da agenda
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </AgendaLayout>
  );
}
