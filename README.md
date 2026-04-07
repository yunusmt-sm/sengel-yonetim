<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1WAp8sZBk82wxTXg4hRzNwc6NGk73rH68

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## WhatsApp Mesaj Gönderimi (Baileys)

Tek komutla hem arayüz hem WhatsApp API çalışır (tek Node süreci).

1. Bağımlılıkları yükleyin: `npm install`
2. Çalıştırın: `npm run dev` — uygulama http://localhost:3000 üzerinde açılır.
3. Yönetici Paneli’ne girin; üstteki WhatsApp panelinde QR kodu görünür.
4. Telefonunuzda WhatsApp → Bağlı Cihazlar → Cihaz Bağla ile QR’ı tarayın.
5. Bağlandıktan sonra panelden numara ve mesaj girerek gönderin.

- Oturum bilgileri proje kökünde `auth_info` klasöründe saklanır.
- API: `GET /api/whatsapp/status`, `POST /api/whatsapp/logout`, `POST /api/send-message`
- Production: `npm run build` sonra `npm run start`
