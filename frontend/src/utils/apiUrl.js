/**
 * Em desenvolvimento, usa o proxy do Vite (/api → backend local).
 * Em produção, VITE_API_URL deve apontar para a API no Render.
 */
export function resolveApiBaseUrl() {
  const configured = import.meta.env.VITE_API_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, '');
  }

  if (import.meta.env.DEV) {
    return '/api';
  }

  console.error('[TapCash] VITE_API_URL não está definida. Configure a variável na Vercel.');
  return '';
}
