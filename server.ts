import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import pino from 'pino';
import QRCode from 'qrcode';
import {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
} from '@whiskeysockets/baileys';

const AUTH_FOLDER = path.join(process.cwd(), 'auth_info');
const logger = pino({ level: 'silent' });

const app = express();
app.use(express.json());

// --- WhatsApp state ---
let sock: ReturnType<typeof makeWASocket> | null = null;
let connectionStatus: 'connecting' | 'open' | 'close' | 'qr' = 'close';
let lastQrBase64: string | null = null;

function clearAuthFolder() {
  if (fs.existsSync(AUTH_FOLDER)) {
    fs.rmSync(AUTH_FOLDER, { recursive: true });
  }
}

function normalizePhoneNumber(phone: string): string {
  const digits = String(phone).replace(/\D/g, '');
  if (digits.startsWith('0')) return '90' + digits.slice(1);
  if (!digits.startsWith('90') && digits.length <= 10) return '90' + digits;
  return digits;
}

async function getWhatsAppVersion(): Promise<[number, number, number]> {
  try {
    const { version } = await Promise.race([
      fetchLatestBaileysVersion(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 15000)
      ),
    ]);
    console.log('[WhatsApp] Sürüm:', version.join('.'));
    return version;
  } catch (e) {
    console.warn('[WhatsApp] Güncel sürüm alınamadı, varsayılan kullanılıyor.', (e as Error).message);
    return [2, 3000, 1027934701];
  }
}

async function connect() {
  connectionStatus = 'connecting';
  lastQrBase64 = null;

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);
  const version = await getWhatsAppVersion();

  sock = makeWASocket({
    version,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    logger,
    printQRInTerminal: false,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      connectionStatus = 'qr';
      try {
        lastQrBase64 = await QRCode.toDataURL(qr, { type: 'image/png', margin: 2 });
        console.log('[WhatsApp] QR kod üretildi.');
      } catch {
        lastQrBase64 = null;
      }
    }

    if (connection === 'open') {
      connectionStatus = 'open';
      lastQrBase64 = null;
      console.log('[WhatsApp] Bağlantı açıldı.');
    }

    if (connection === 'close') {
      connectionStatus = 'close';
      lastQrBase64 = null;
      sock = null;
      const statusCode = (lastDisconnect?.error as { output?: { statusCode?: number } })?.output?.statusCode;
      console.log('[WhatsApp] Bağlantı kapandı, statusCode:', statusCode);
      if (statusCode !== DisconnectReason.loggedOut) {
        console.log('[WhatsApp] 3 saniye sonra yeniden bağlanılıyor...');
        setTimeout(() => connect(), 3000);
      }
    }
  });

  return sock;
}

// Bağlantıyı sadece istek üzerine başlat (otomatik connect yok)
function ensureConnecting() {
  if (connectionStatus === 'close' && !sock) {
    connect().catch((err) => {
      console.error('WhatsApp connect error:', err);
      connectionStatus = 'close';
    });
  }
}

// --- API Routes (Express önce, Vite sonra) ---

app.get('/api/whatsapp/status', (_req, res) => {
  res.json({ status: connectionStatus, qr: lastQrBase64 ?? null });
});

app.post('/api/whatsapp/connect', (_req, res) => {
  ensureConnecting();
  res.json({ success: true, message: 'QR oluşturuluyor...' });
});

app.post('/api/whatsapp/logout', async (_req, res) => {
  try {
    if (sock) {
      try {
        sock.end(undefined);
      } catch {}
      sock = null;
    }
    connectionStatus = 'close';
    lastQrBase64 = null;
    clearAuthFolder();
    // Yeni QR için tekrar butona basılacak; otomatik connect yok
    res.json({ success: true, message: 'Oturum kapatıldı. Yeni QR için "QR Oluştur"a basın.' });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

app.post('/api/send-message', async (req, res) => {
  const { to, message } = req.body;
  if (!to || !message) {
    return res.status(400).json({ success: false, error: 'Alıcı numarası ve mesaj gerekli.' });
  }

  if (!sock || connectionStatus !== 'open') {
    return res.status(503).json({
      success: false,
      error: 'WhatsApp bağlı değil. Önce QR ile bağlanın.',
    });
  }

  const jid = normalizePhoneNumber(to) + '@s.whatsapp.net';
  try {
    await sock.sendMessage(jid, { text: message });
    res.json({ success: true, message: 'Mesaj gönderildi.' });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: (err as Error).message || 'Mesaj gönderilemedi.',
    });
  }
});

// --- Vite (dev) veya static (prod) ---
const PORT = Number(process.env.PORT) || 3000;

async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), 'dist')));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Uygulama http://localhost:${PORT} üzerinde çalışıyor.`);
  });
}

start();
