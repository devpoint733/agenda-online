import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import s from "../styles/pages.module.css";

const API = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

function formatDateLabel(dateStr) {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" });
}

function toDateInput(daysAhead) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatSlot(dt) {
  const date = new Date(String(dt).replace(" ", "T"));
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export default function PublicAgendaPage() {
  const router = useRouter();
  const { slug } = router.query;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [agenda, setAgenda] = useState(null);
  const [servicos, setServicos] = useState([]);
  const [campos, setCampos] = useState([]);

  const [servicoId, setServicoId] = useState("");
  const [date, setDate] = useState(toDateInput(0));
  const [slots, setSlots] = useState([]);
  const [slot, setSlot] = useState(null);

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [camposResp, setCamposResp] = useState({});
  const [sending, setSending] = useState(false);

  const servicoSelecionado = useMemo(
    () => servicos.find((x) => String(x.id) === String(servicoId)) || null,
    [servicos, servicoId]
  );

  useEffect(() => {
    if (!slug) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API}/public/agendas/${slug}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Falha ao carregar agenda.");
        if (!mounted) return;
        setAgenda(data.agenda);
        setServicos(data.servicos || []);
        setCampos(data.campos || []);
      } catch (e) {
        if (mounted) setError(e.message);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [slug]);

  useEffect(() => {
    if (!slug || !servicoId || !date) return;
    let mounted = true;
    (async () => {
      setError("");
      setSlot(null);
      try {
        const qs = new URLSearchParams({ date, servico_id: String(servicoId) });
        const res = await fetch(`${API}/public/agendas/${slug}/disponibilidade?${qs.toString()}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Falha ao carregar horários.");
        if (!mounted) return;
        setSlots(data.slots || []);
      } catch (e) {
        if (mounted) {
          setError(e.message);
          setSlots([]);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [slug, servicoId, date]);

  async function submitBooking(e) {
    e.preventDefault();
    if (!slot) return;
    setSending(true);
    setError("");
    try {
      const respostas = campos
        .map((c) => ({ definicao_campo_id: c.id, valor_texto: camposResp[c.id] }))
        .filter((r) => r.valor_texto != null && String(r.valor_texto).trim() !== "");
      const res = await fetch(`${API}/public/agendas/${slug}/agendamentos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          servico_id: Number(servicoId),
          inicio_em: slot.inicio_em,
          nome_completo: nome,
          email,
          telefone,
          mensagem_cliente: mensagem || null,
          respostas,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Não foi possível concluir o agendamento.");
      router.push(`/${slug}/confirmacao?agendamento=${data.id}`);
    } catch (e) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <Head>
        <title>{agenda ? `${agenda.nome} - Agendamento` : "Agendamento"}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>

      <div className={s.pageShell}>
        <div className={s.card}>
          <h1 className={s.pageTitle} style={{ marginBottom: 6 }}>
            {agenda?.nome || "Agendamento"}
          </h1>
          <p className={s.muted} style={{ margin: 0 }}>
            Escolha serviço, data e horário. Fluxo rápido em 3 passos.
          </p>
        </div>

        {loading ? <p className={s.muted}>Carregando agenda...</p> : null}
        {error ? (
          <p className={s.error} role="alert">
            {error}
          </p>
        ) : null}
        {!loading && agenda ? (
          <>
            <section className={s.card}>
              <h2 className={s.muted} style={{ margin: "0 0 10px", fontSize: "1rem", fontWeight: 600 }}>
                1) Serviço
              </h2>
              <div className={s.formStack}>
                <select className={s.select} value={servicoId} onChange={(e) => setServicoId(e.target.value)}>
                  <option value="">Selecione um serviço</option>
                  {servicos.map((srv) => (
                    <option key={srv.id} value={srv.id}>
                      {srv.nome} ({srv.duracao_minutos} min)
                    </option>
                  ))}
                </select>
                {servicoSelecionado ? (
                  <p className={s.muted} style={{ margin: 0 }}>
                    {servicoSelecionado.descricao || "Sem descrição."}
                  </p>
                ) : null}
              </div>
            </section>

            <section className={s.card}>
              <h2 className={s.muted} style={{ margin: "0 0 10px", fontSize: "1rem", fontWeight: 600 }}>
                2) Data e horário
              </h2>
              <div className={s.formStack}>
                <input
                  className={s.input}
                  type="date"
                  value={date}
                  min={toDateInput(0)}
                  onChange={(e) => setDate(e.target.value)}
                />
                <p className={s.muted} style={{ margin: 0 }}>
                  {formatDateLabel(date)}
                </p>
                <div className={s.dayChips}>
                  {slots.map((sl) => {
                    const active = slot?.inicio_em === sl.inicio_em;
                    return (
                      <button
                        key={sl.inicio_em}
                        type="button"
                        className={`${s.dayChip} ${active ? s.dayChipActive : ""}`}
                        onClick={() => setSlot(sl)}
                      >
                        {formatSlot(sl.inicio_em)}
                      </button>
                    );
                  })}
                  {servicoId && slots.length === 0 ? (
                    <span className={s.muted}>Sem horários disponíveis nessa data.</span>
                  ) : null}
                </div>
              </div>
            </section>

            <section className={s.card}>
              <h2 className={s.muted} style={{ margin: "0 0 10px", fontSize: "1rem", fontWeight: 600 }}>
                3) Seus dados
              </h2>
              <form className={s.formStack} onSubmit={submitBooking}>
                <input
                  className={s.input}
                  placeholder="Nome completo"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                />
                <input
                  className={s.input}
                  type="email"
                  placeholder="E-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <input
                  className={s.input}
                  inputMode="tel"
                  placeholder="Telefone"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  required
                />
                {campos.map((c) => (
                  <div key={c.id}>
                    <label className={s.label}>{c.rotulo}</label>
                    <input
                      className={s.input}
                      value={camposResp[c.id] || ""}
                      required={Boolean(c.obrigatorio)}
                      onChange={(e) => setCamposResp((prev) => ({ ...prev, [c.id]: e.target.value }))}
                    />
                  </div>
                ))}
                <textarea
                  className={s.textarea}
                  placeholder="Mensagem (opcional)"
                  value={mensagem}
                  onChange={(e) => setMensagem(e.target.value)}
                />
                <button className={s.btnPrimary} type="submit" disabled={!servicoId || !slot || sending}>
                  {sending ? "Confirmando..." : "Confirmar agendamento"}
                </button>
              </form>
            </section>
          </>
        ) : null}
      </div>
    </>
  );
}
