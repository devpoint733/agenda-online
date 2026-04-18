import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Menu, X } from "lucide-react";
import styles from "./AgendaLayout.module.css";

const nav = (id) => [
  { href: `/agendas/${id}`, label: "Início" },
  { href: `/agendas/${id}/agendamentos`, label: "Agendamentos" },
  { href: `/agendas/${id}/clientes`, label: "Clientes" },
  { href: `/agendas/${id}/servicos`, label: "Serviços" },
  { href: `/agendas/${id}/configuracao`, label: "Ajustes" },
];

export default function AgendaLayout({ children, agendaTitle }) {
  const router = useRouter();
  const { agendaId } = router.query;
  const id = agendaId;
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [router.pathname]);

  useEffect(() => {
    if (!open) return;
    const onResize = () => {
      if (window.innerWidth >= 1024) setOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [open]);

  if (!id) {
    return <div className={styles.shell}>{children}</div>;
  }

  const items = nav(id);
  const title = agendaTitle || "Agenda";

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <button
          type="button"
          className={styles.menuBtn}
          aria-label="Abrir menu"
          onClick={() => setOpen(true)}
        >
          <Menu size={22} />
        </button>
        <span className={styles.brand}>{title}</span>
        <Link href="/agendas" className={styles.backLink}>
          Agendas
        </Link>
      </header>

      <div
        className={`${styles.overlay} ${open ? styles.overlayOpen : ""}`}
        aria-hidden={!open}
        onClick={() => setOpen(false)}
      />

      <div className={styles.layout}>
        <aside className={`${styles.sidebar} ${open ? styles.sidebarOpen : ""}`}>
          <div className={styles.desktopHeader}>
            <h1>{title}</h1>
            <p>
              <Link href="/agendas" className={styles.backLink}>
                ← Todas as agendas
              </Link>
            </p>
          </div>
          <nav className={styles.nav} aria-label="Principal">
            {open && (
              <button
                type="button"
                className={styles.menuBtn}
                style={{ margin: "0 8px 12px auto", display: "flex" }}
                aria-label="Fechar menu"
                onClick={() => setOpen(false)}
              >
                <X size={22} />
              </button>
            )}
            {items.map(({ href, label }) => {
              const active = router.pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`${styles.navLink} ${active ? styles.navLinkActive : ""}`}
                  onClick={() => setOpen(false)}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}
