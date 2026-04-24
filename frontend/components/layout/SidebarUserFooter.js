import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { ChevronUp } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import styles from "./SidebarUserFooter.module.css";

function initialsFromNome(nome) {
  if (!nome || typeof nome !== "string") return "?";
  const parts = nome.split(" ").filter(Boolean).slice(0, 2);
  if (parts.length === 0) return "?";
  return parts.map((p) => p[0]?.toUpperCase()).join("");
}

/**
 * Rodapé da sidebar: avatar, nome e menu (voltar às agendas / sair).
 * @param {{ onRequestCloseMobile?: () => void }} props
 */
export default function SidebarUserFooter({ onRequestCloseMobile }) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [avatarBroken, setAvatarBroken] = useState(false);
  const profileWrapRef = useRef(null);

  const displayName = user?.nome?.trim() || "Usuário";
  const avatarInitials = initialsFromNome(user?.nome);

  useEffect(() => {
    setAvatarBroken(false);
  }, [user?.avatar_url]);

  useEffect(() => {
    if (!profileMenuOpen) return;
    const onPointerDown = (e) => {
      if (!profileWrapRef.current?.contains(e.target)) setProfileMenuOpen(false);
    };
    const onEscape = (e) => {
      if (e.key === "Escape") setProfileMenuOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onEscape);
    };
  }, [profileMenuOpen]);

  function handleSair() {
    setProfileMenuOpen(false);
    onRequestCloseMobile?.();
    logout();
    router.replace("/login");
  }

  function closeAfterNav() {
    setProfileMenuOpen(false);
    onRequestCloseMobile?.();
  }

  return (
    <div className={styles.sidebarFooter} ref={profileWrapRef}>
      <button
        type="button"
        className={styles.profileTrigger}
        aria-expanded={profileMenuOpen}
        aria-haspopup="menu"
        onClick={() => setProfileMenuOpen((v) => !v)}
      >
        <span className={styles.profileAvatar}>
          {user?.avatar_url && !avatarBroken ? (
            <img
              src={user.avatar_url}
              alt=""
              className={styles.profileAvatarImg}
              onError={() => setAvatarBroken(true)}
            />
          ) : (
            <span className={styles.profileAvatarInitials}>{avatarInitials}</span>
          )}
        </span>
        <span className={styles.profileMeta}>
          <span className={styles.profileName}>{displayName}</span>
          <ChevronUp
            size={16}
            className={`${styles.profileChevron} ${profileMenuOpen ? styles.profileChevronOpen : ""}`}
            aria-hidden
          />
        </span>
      </button>
      {profileMenuOpen ? (
        <div className={styles.profileDropdown} role="menu">
          <Link href="/agendas" className={styles.profileMenuLink} role="menuitem" onClick={closeAfterNav}>
            Voltar para agendas
          </Link>
          <button type="button" className={styles.profileMenuBtn} role="menuitem" onClick={handleSair}>
            Sair
          </button>
        </div>
      ) : null}
    </div>
  );
}
