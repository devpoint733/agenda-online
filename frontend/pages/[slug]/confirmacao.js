import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import s from "../../styles/pages.module.css";

const API = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

function formatDateTime(value) {
  const d = new Date(String(value).replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ConfirmacaoAgendamentoPage() {
  const router = useRouter();
  const { slug, agendamento } = router.query;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [agenda, setAgenda] = useState(null);
  const [dados, setDados] = useState(null);

  useEffect(() => {
    if (!slug || !agendamento) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API}/public/agendas/${slug}/agendamentos/${agendamento}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Não foi possível carregar a confirmação.");
        if (!mounted) return;
        setAgenda(data.agenda || null);
        setDados(data.agendamento || null);
      } catch (e) {
        if (mounted) setError(e.message);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [slug, agendamento]);

  return (
    <>
      <Head>
        <title>Confirmação de agendamento</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>

      <div className={s.pageShell}>
        <div className={s.card}>
          <h1 className={s.pageTitle}>Agendamento confirmado</h1>
          <p className={s.muted} style={{ margin: 0 }}>
            {agenda?.nome ? `Agenda: ${agenda.nome}` : "Seu agendamento foi registrado com sucesso."}
          </p>
        </div>

        {loading ? <p className={s.muted}>Carregando dados do agendamento...</p> : null}
        {error ? (
          <p className={s.error} role="alert">
            {error}
          </p>
        ) : null}

        {!loading && !error && dados ? (
          <div className={s.card}>
            <div className={s.formStack}>
              <div>
                <label className={s.label}>Serviço</label>
                <p style={{ margin: 0 }}>{dados.servico_nome}</p>
              </div>
              <div>
                <label className={s.label}>Data e horário</label>
                <p style={{ margin: 0 }}>{formatDateTime(dados.inicio_em)}</p>
              </div>
              <div>
                <label className={s.label}>Cliente</label>
                <p style={{ margin: 0 }}>{dados.nome_completo}</p>
              </div>
              <div>
                <label className={s.label}>E-mail</label>
                <p style={{ margin: 0 }}>{dados.email}</p>
              </div>
              <div>
                <label className={s.label}>Telefone</label>
                <p style={{ margin: 0 }}>{dados.telefone}</p>
              </div>
              {dados.mensagem_cliente ? (
                <div>
                  <label className={s.label}>Mensagem enviada</label>
                  <p style={{ margin: 0 }}>{dados.mensagem_cliente}</p>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className={s.card}>
          <button type="button" className={s.btnPrimary} onClick={() => router.push(`/${slug}`)}>
            Fazer novo agendamento
          </button>
        </div>
      </div>
    </>
  );
}
