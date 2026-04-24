const baseUrl = () => {
  const u = process.env.NEXT_PUBLIC_API_URL;
  if (!u) return "";
  return String(u).replace(/\/$/, "");
};

export function getApiBaseUrl() {
  return baseUrl();
}

export function getStoredToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

/**
 * @param {string} path - ex: "/auth/login" (com barra inicial)
 * @param {RequestInit & { json?: unknown }} options
 */
export async function api(path, options = {}) {
  const url = `${baseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  const headers = new Headers(options.headers);

  if (options.json !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  const token = getStoredToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const init = {
    ...options,
    headers,
  };

  if (options.json !== undefined) {
    init.body = JSON.stringify(options.json);
    delete init.json;
  }

  const res = await fetch(url, init);
  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const msg =
      typeof data === "object" && data && "error" in data ? data.error : res.statusText;
    const err = new Error(typeof msg === "string" ? msg : "Erro na requisição");
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

/**
 * Envia imagem de avatar (multipart, campo "imagem") para Cloudinary via API.
 * @param {File} file
 */
export async function uploadUserAvatar(file) {
  const url = `${baseUrl()}/usuarios/avatar`;
  const headers = new Headers();
  const token = getStoredToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  const body = new FormData();
  body.append("imagem", file);
  const res = await fetch(url, { method: "POST", headers, body });
  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  if (!res.ok) {
    const msg =
      typeof data === "object" && data && "error" in data ? data.error : res.statusText;
    throw new Error(typeof msg === "string" ? msg : "Erro no upload");
  }
  return data;
}
