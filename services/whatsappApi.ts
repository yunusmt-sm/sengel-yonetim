/**
 * WhatsApp Baileys backend API (proxy: /api -> server)
 */

const API_BASE = '/api';

export type WhatsAppStatus = 'connecting' | 'open' | 'close' | 'qr';

export interface WhatsAppStatusResponse {
  status: WhatsAppStatus;
  qr: string | null;
}

export async function fetchWhatsAppStatus(): Promise<WhatsAppStatusResponse> {
  const res = await fetch(`${API_BASE}/whatsapp/status`);
  if (!res.ok) throw new Error('Durum alınamadı');
  return res.json();
}

export async function whatsappLogout(): Promise<{ success: boolean; message?: string; error?: string }> {
  const res = await fetch(`${API_BASE}/whatsapp/logout`, { method: 'POST' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Çıkış yapılamadı');
  return data;
}

export async function whatsappConnect(): Promise<{ success: boolean; message?: string }> {
  const res = await fetch(`${API_BASE}/whatsapp/connect`, { method: 'POST' });
  const data = await res.json();
  if (!res.ok) throw new Error('Bağlantı başlatılamadı');
  return data;
}

export async function sendWhatsAppMessage(to: string, message: string): Promise<{ success: boolean; message?: string; error?: string }> {
  const res = await fetch(`${API_BASE}/send-message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, message }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Mesaj gönderilemedi');
  return data;
}
