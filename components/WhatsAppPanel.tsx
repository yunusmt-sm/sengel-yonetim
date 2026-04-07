import React, { useState, useEffect } from 'react';
import {
  fetchWhatsAppStatus,
  whatsappLogout,
  whatsappConnect,
  sendWhatsAppMessage,
  type WhatsAppStatus,
} from '../services/whatsappApi';

const WhatsAppPanel: React.FC = () => {
  const [status, setStatus] = useState<WhatsAppStatus>('close');
  const [qr, setQr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sendPhone, setSendPhone] = useState('');
  const [sendMessage, setSendMessage] = useState('');
  const [sendResult, setSendResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [connectLoading, setConnectLoading] = useState(false);

  const pollStatus = () => {
    fetchWhatsAppStatus()
      .then((data) => {
        setStatus(data.status);
        setQr(data.qr);
      })
      .catch(() => {
        setStatus('close');
        setQr(null);
      });
  };

  useEffect(() => {
    pollStatus();
    const interval = setInterval(pollStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  // QR istendiyse veya connecting/qr durumundaysa daha sık kontrol
  useEffect(() => {
    if (status === 'connecting' || status === 'qr' || connectLoading) {
      const fast = setInterval(pollStatus, 1500);
      return () => clearInterval(fast);
    }
  }, [status, connectLoading]);

  const handleConnect = async () => {
    setConnectLoading(true);
    setSendResult(null);
    try {
      await whatsappConnect();
      pollStatus();
    } catch (e) {
      setSendResult({ ok: false, text: (e as Error).message });
    } finally {
      setConnectLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await whatsappLogout();
      setStatus('close');
      setQr(null);
      pollStatus();
    } catch (e) {
      setSendResult({ ok: false, text: (e as Error).message });
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sendPhone.trim() || !sendMessage.trim()) return;
    setLoading(true);
    setSendResult(null);
    try {
      await sendWhatsAppMessage(sendPhone.trim(), sendMessage.trim());
      setSendResult({ ok: true, text: 'Mesaj gönderildi.' });
      setSendMessage('');
    } catch (e) {
      setSendResult({ ok: false, text: (e as Error).message });
    } finally {
      setLoading(false);
    }
  };

  const isConnected = status === 'open';

  return (
    <div className="bg-slate-800 border-b border-slate-700 text-white">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Bağlantı durumu */}
          <div className="flex items-center gap-3">
            {status === 'connecting' && (
              <span className="text-amber-400 text-sm font-medium">Bağlanıyor... (QR kodu birkaç saniye içinde görünecek)</span>
            )}
            {status === 'qr' && (
              <div className="flex items-center gap-3 flex-wrap">
                <div className="bg-white p-2 rounded-lg inline-block">
                  {qr ? (
                    <img src={qr} alt="WhatsApp QR" className="w-32 h-32 sm:w-40 sm:h-40" />
                  ) : (
                    <div className="w-32 h-32 sm:w-40 sm:h-40 bg-slate-200 animate-pulse rounded" />
                  )}
                </div>
                <div>
                  <p className="text-amber-400 font-medium text-sm sm:text-base">WhatsApp&apos;ı Bağlayın</p>
                  <p className="text-slate-400 text-xs mt-1">Telefonunuzda WhatsApp &gt; Bağlı Cihazlar &gt; Cihaz Bağla ile bu QR kodunu tarayın.</p>
                </div>
              </div>
            )}
            {isConnected && (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium bg-green-900/60 text-green-300 border border-green-700">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  WhatsApp Bağlı
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loading}
                  className="text-sm px-3 py-1.5 rounded bg-slate-700 hover:bg-red-600/80 text-white disabled:opacity-50"
                >
                  Çıkış Yap
                </button>
              </div>
            )}
            {status === 'close' && !qr && (
              <div className="flex items-center gap-3">
                <span className="text-slate-400 text-sm">WhatsApp bağlı değil.</span>
                <button
                  type="button"
                  onClick={handleConnect}
                  disabled={connectLoading}
                  className="px-4 py-2 rounded bg-green-700 hover:bg-green-600 text-white text-sm font-medium disabled:opacity-50"
                >
                  {connectLoading ? 'QR oluşturuluyor...' : 'QR Oluştur'}
                </button>
              </div>
            )}
          </div>

          {/* Mesaj gönder (sadece bağlıyken) */}
          {isConnected && (
            <form onSubmit={handleSendMessage} className="flex flex-col sm:flex-row gap-2 sm:items-end">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400">Alıcı numara (örn. 5XX XXX XX XX)</label>
                <input
                  type="tel"
                  value={sendPhone}
                  onChange={(e) => setSendPhone(e.target.value)}
                  placeholder="5XXXXXXXXX"
                  className="bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm text-white placeholder-slate-500 w-full sm:w-40"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400">Mesaj</label>
                <input
                  type="text"
                  value={sendMessage}
                  onChange={(e) => setSendMessage(e.target.value)}
                  placeholder="Mesajınız..."
                  className="bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm text-white placeholder-slate-500 w-full sm:w-48"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !sendPhone.trim() || !sendMessage.trim()}
                className="px-4 py-2 rounded bg-green-700 hover:bg-green-600 text-white text-sm font-medium disabled:opacity-50"
              >
                {loading ? 'Gönderiliyor...' : 'Gönder'}
              </button>
            </form>
          )}
        </div>

        {sendResult && (
          <div
            className={`mt-2 text-sm px-3 py-2 rounded ${
              sendResult.ok ? 'bg-green-900/40 text-green-300' : 'bg-red-900/40 text-red-300'
            }`}
          >
            {sendResult.text}
          </div>
        )}
      </div>
    </div>
  );
};

export default WhatsAppPanel;
