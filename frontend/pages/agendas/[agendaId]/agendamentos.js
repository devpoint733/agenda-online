import Head from "next/head";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, closestCorners } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useAuth } from "../../../hooks/useAuth";
import { api } from "../../../lib/api";
import AgendaLayout from "../../../components/layout/AgendaLayout";
import Modal from "../../../components/configuracao/Modal";
import s from "../../../styles/pages.module.css";

const COLUMNS = [
  { key: "pendente", label: "Pendente" },
  { key: "confirmado", label: "Confirmado" },
  { key: "concluido", label: "Concluído" },
  { key: "cancelado", label: "Cancelado" },
  { key: "nao_compareceu", label: "Não compareceu" },
];

function fmt(dt) {
  if (!dt) return "—";
  try {
    const raw = String(dt).trim();
    const iso = raw.includes("T") ? raw : raw.replace(" ", "T");
    return format(parseISO(iso), "dd/MM/yyyy HH:mm", { locale: ptBR });
  } catch {
    return dt;
  }
}

function badgeClass(situacao) {
  if (situacao === "confirmado" || situacao === "concluido") return s.badgeOk;
  if (situacao === "pendente") return s.badgeWarn;
  if (situacao === "cancelado" || situacao === "nao_compareceu") return s.badgeErr;
  return s.badgeNeu;
}

function KanbanCardFace({ item, clienteNome, servicoNome, showId = true }) {
  return (
    <>
      <div className={s.rowBetween}>
        <span className={`${s.badge} ${badgeClass(item.situacao)}`}>{item.situacao?.replace("_", " ")}</span>
        {showId ? <span className={s.muted}>#{item.id}</span> : null}
      </div>
      <p className={s.kanbanTitle}>{clienteNome || "Cliente"}</p>
      <p className={s.muted} style={{ margin: "0 0 6px" }}>
        {servicoNome || "Serviço"}
      </p>
      <p className={s.muted} style={{ margin: 0 }}>
        {fmt(item.inicio_em)} - {fmt(item.fim_em)}
      </p>
    </>
  );
}

function toMysqlDatetime(v) {
  if (!v) return null;
  const x = String(v).replace("T", " ");
  return x.length === 16 ? `${x}:00` : x;
}

function resolveDropStatus(overId, rows) {
  if (!overId) return null;
  if (String(overId).startsWith("col-")) return String(overId).replace("col-", "");
  const target = rows.find((r) => String(r.id) === String(overId));
  return target?.situacao || null;
}

function AgendamentoCard({ item, clienteNome, servicoNome, mobile = false }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: String(item.id),
    data: { type: "item", item },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${s.kanbanCard} ${isDragging ? s.kanbanCardSource : ""}`}
      {...attributes}
      {...listeners}
    >
      <KanbanCardFace item={item} clienteNome={clienteNome} servicoNome={servicoNome} showId={!mobile} />
    </div>
  );
}

function ColumnDroppable({ col, items, clienteMap, servicoMap, isDropTarget }) {
  const { setNodeRef } = useSortable({
    id: `col-${col.key}`,
    data: { type: "column", status: col.key },
  });

  return (
    <section
      ref={setNodeRef}
      className={`${s.kanbanColumn} ${isDropTarget ? s.kanbanColumnDropTarget : ""}`}
    >
      <div className={s.rowBetween} style={{ alignItems: "center", marginBottom: 8 }}>
        <h3 className={s.kanbanColumnTitle}>{col.label}</h3>
        <span className={s.badge + " " + s.badgeNeu}>{items.length}</span>
      </div>
      <SortableContext items={items.map((x) => String(x.id))} strategy={verticalListSortingStrategy}>
        <div className={s.kanbanList}>
          {items.map((r) => (
            <AgendamentoCard
              key={r.id}
              item={r}
              clienteNome={clienteMap.get(r.cliente_id)}
              servicoNome={servicoMap.get(r.servico_id)}
            />
          ))}
        </div>
      </SortableContext>
    </section>
  );
}

export default function AgendaAgendamentosPage() {
  const router = useRouter();
  const { agendaId } = router.query;
  const { user, loading } = useAuth();
  const [rows, setRows] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [error, setError] = useState("");
  const [agendaNome, setAgendaNome] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [mobileStatus, setMobileStatus] = useState("pendente");
  const [clienteId, setClienteId] = useState("");
  const [servicoId, setServicoId] = useState("");
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [situacao, setSituacao] = useState("confirmado");
  const [saving, setSaving] = useState(false);
  const [activeDragId, setActiveDragId] = useState(null);
  const [overDropId, setOverDropId] = useState(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const clienteMap = useMemo(() => new Map(clientes.map((c) => [c.id, c.nome_completo])), [clientes]);
  const servicoMap = useMemo(() => new Map(servicos.map((x) => [x.id, x.nome])), [servicos]);
  const rowsByStatus = useMemo(() => {
    const map = {};
    COLUMNS.forEach((c) => {
      map[c.key] = rows.filter((r) => r.situacao === c.key).sort((a, b) => new Date(a.inicio_em) - new Date(b.inicio_em));
    });
    return map;
  }, [rows]);

  const activeDragItem = useMemo(
    () => (activeDragId ? rows.find((r) => String(r.id) === String(activeDragId)) ?? null : null),
    [activeDragId, rows]
  );

  const dropTargetStatus = useMemo(() => {
    if (!activeDragId || overDropId == null) return null;
    return resolveDropStatus(overDropId, rows);
  }, [activeDragId, overDropId, rows]);

  const load = useCallback(async () => {
    if (!agendaId) return;
    setError("");
    try {
      const [ag, list, c, srv] = await Promise.all([
        api(`/agendas/${agendaId}`),
        api(`/agendas/${agendaId}/agendamentos`),
        api(`/agendas/${agendaId}/clientes`),
        api(`/agendas/${agendaId}/servicos`),
      ]);
      setAgendaNome(ag.nome || "");
      setRows(Array.isArray(list) ? list : []);
      setClientes(Array.isArray(c) ? c : []);
      setServicos(Array.isArray(srv) ? srv : []);
    } catch (err) {
      setError(err.message || "Erro ao carregar");
    }
  }, [agendaId]);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    load();
  }, [load]);

  async function criar(e) {
    e.preventDefault();
    if (!agendaId) return;
    setSaving(true);
    setError("");
    try {
      await api(`/agendas/${agendaId}/agendamentos`, {
        method: "POST",
        json: {
          cliente_id: Number(clienteId),
          servico_id: Number(servicoId),
          inicio_em: toMysqlDatetime(inicio),
          fim_em: toMysqlDatetime(fim),
          situacao,
        },
      });
      setClienteId("");
      setServicoId("");
      setInicio("");
      setFim("");
      setSituacao("confirmado");
      setModalOpen(false);
      await load();
    } catch (err) {
      setError(err.message || "Não foi possível criar");
    } finally {
      setSaving(false);
    }
  }

  async function patchSituacao(id, sit) {
    try {
      await api(`/agendas/${agendaId}/agendamentos/${id}`, {
        method: "PATCH",
        json: { situacao: sit },
      });
      await load();
    } catch (err) {
      setError(err.message || "Erro ao atualizar");
    }
  }

  async function onDragEnd(event) {
    const { active, over } = event;
    setActiveDragId(null);
    setOverDropId(null);
    if (!over) return;
    const id = Number(active.id);
    const current = rows.find((r) => r.id === id);
    if (!current) return;
    const nextStatus = resolveDropStatus(over.id, rows);
    if (!nextStatus || nextStatus === current.situacao) return;
    await patchSituacao(id, nextStatus);
  }

  if (!agendaId || loading || !user) {
    return (
      <AgendaLayout>
        <p className={s.muted}>Carregando…</p>
      </AgendaLayout>
    );
  }

  return (
    <AgendaLayout agendaTitle={agendaNome || "Agendamentos"}>
      <Head>
        <title>Agendamentos</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>
      <h1 className={s.pageTitle}>Agendamentos</h1>
      {error ? (
        <p className={s.error} role="alert">
          {error}
        </p>
      ) : null}

      <div className={s.card} style={{ marginBottom: "var(--spacing-md)" }}>
        <div className={s.rowBetween} style={{ alignItems: "center" }}>
          <p className={s.muted} style={{ margin: 0 }}>
            Arraste entre colunas para mudar status.
          </p>
          <button type="button" className={s.btnPrimary} onClick={() => setModalOpen(true)}>
            Novo agendamento
          </button>
        </div>
      </div>

      <div className={s.mobileOnly}>
        <div className={s.tabs} role="tablist">
          {COLUMNS.map((c) => (
            <button
              key={c.key}
              type="button"
              className={`${s.tab} ${mobileStatus === c.key ? s.tabActive : ""}`}
              onClick={() => setMobileStatus(c.key)}
            >
              {c.label} ({rowsByStatus[c.key]?.length || 0})
            </button>
          ))}
        </div>
        <div className={s.cardList}>
          {(rowsByStatus[mobileStatus] || []).map((r) => (
            <div key={r.id} className={s.card}>
              <div className={s.rowBetween}>
                <span className={`${s.badge} ${badgeClass(r.situacao)}`}>{r.situacao?.replace("_", " ")}</span>
                <span className={s.muted}>#{r.id}</span>
              </div>
              <p style={{ margin: "10px 0 4px", fontWeight: 600 }}>{clienteMap.get(r.cliente_id) || "Cliente"}</p>
              <p className={s.muted} style={{ margin: "0 0 6px" }}>
                {servicoMap.get(r.servico_id) || "Serviço"}
              </p>
              <p className={s.muted} style={{ margin: 0 }}>
                {fmt(r.inicio_em)} - {fmt(r.fim_em)}
              </p>
              <div className={s.btnRow} style={{ marginTop: 10 }}>
                {COLUMNS.filter((c) => c.key !== r.situacao).map((c) => (
                  <button key={c.key} type="button" className={s.btnGhost} onClick={() => patchSituacao(r.id, c.key)}>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={s.desktopOnly}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={({ active }) => setActiveDragId(String(active.id))}
          onDragOver={({ over }) => setOverDropId(over ? String(over.id) : null)}
          onDragEnd={onDragEnd}
          onDragCancel={() => {
            setActiveDragId(null);
            setOverDropId(null);
          }}
        >
          <div className={s.kanbanBoard}>
            {COLUMNS.map((col) => (
              <ColumnDroppable
                key={col.key}
                col={col}
                items={rowsByStatus[col.key] || []}
                clienteMap={clienteMap}
                servicoMap={servicoMap}
                isDropTarget={Boolean(
                  activeDragItem && dropTargetStatus === col.key && dropTargetStatus !== activeDragItem.situacao
                )}
              />
            ))}
          </div>
          <DragOverlay dropAnimation={{ duration: 200, easing: "cubic-bezier(0.25, 1, 0.5, 1)" }}>
            {activeDragItem ? (
              <div className={`${s.kanbanCard} ${s.kanbanCardOverlay}`}>
                <KanbanCardFace
                  item={activeDragItem}
                  clienteNome={clienteMap.get(activeDragItem.cliente_id)}
                  servicoNome={servicoMap.get(activeDragItem.servico_id)}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {modalOpen ? (
        <Modal
          title="Novo agendamento"
          onClose={() => setModalOpen(false)}
          actions={
            <>
              <button type="button" className={s.btnGhost} onClick={() => setModalOpen(false)}>
                Cancelar
              </button>
              <button type="submit" form="agendamento-create-form" className={s.btnPrimary} disabled={saving}>
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </>
          }
        >
          <form id="agendamento-create-form" onSubmit={criar} className={s.formStack}>
            <div>
              <label className={s.label}>Cliente</label>
              <select className={s.select} value={clienteId} onChange={(e) => setClienteId(e.target.value)} required>
                <option value="">Selecione</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome_completo}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={s.label}>Serviço</label>
              <select className={s.select} value={servicoId} onChange={(e) => setServicoId(e.target.value)} required>
                <option value="">Selecione</option>
                {servicos.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.nome}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={s.label}>Início</label>
              <input className={s.input} type="datetime-local" value={inicio} onChange={(e) => setInicio(e.target.value)} required />
            </div>
            <div>
              <label className={s.label}>Fim</label>
              <input className={s.input} type="datetime-local" value={fim} onChange={(e) => setFim(e.target.value)} required />
            </div>
            <div>
              <label className={s.label}>Situação inicial</label>
              <select className={s.select} value={situacao} onChange={(e) => setSituacao(e.target.value)}>
                {COLUMNS.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </form>
        </Modal>
      ) : null}
    </AgendaLayout>
  );
}
