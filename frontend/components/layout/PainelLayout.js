import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Menu, X } from "lucide-react";
import SidebarUserFooter from "./SidebarUserFooter";
import styles from "./PainelLayout.module.css";

/**
 * @param {object} props
 * @param {React.ReactNode} props.children
 * @param {string} props.title
 * @param {{ key: string, label: string }[]} props.items
 * @param {string} props.activeKey
 * @param {(key: string) => void} props.onSelect
 */
export default function PainelLayout({ children, title, items, activeKey, onSelect }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const activeLabel = items.find((i) => i.key === activeKey)?.label || title;

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

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <button type="button" className={styles.menuBtn} aria-label="Abrir menu" onClick={() => setOpen(true)}>
          <Menu size={22} />
        </button>
        <span className={styles.brand}>{activeLabel}</span>
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
          </div>
          <nav className={styles.nav} aria-label="Seções do painel">
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
            {items.map(({ key, label }) => {
              const active = activeKey === key;
              return (
                <button
                  key={key}
                  type="button"
                  className={`${styles.navLink} ${styles.navBtn} ${active ? styles.navLinkActive : ""}`}
                  aria-current={active ? "page" : undefined}
                  onClick={() => {
                    onSelect(key);
                    setOpen(false);
                  }}
                >
                  {label}
                </button>
              );
            })}
          </nav>
          <SidebarUserFooter onRequestCloseMobile={() => setOpen(false)} />
        </aside>

        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}
