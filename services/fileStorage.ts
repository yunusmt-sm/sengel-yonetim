// Session bazlı dosya depolama servisi
// Dosyalar sessionStorage'da saklanır, database'e kayıt olmaz

// ImgBB API Key - localStorage'da saklanır
const IMGBB_API_KEY_STORAGE_KEY = 'imgbb_api_key';
const DEFAULT_IMGBB_API_KEY = 'e59a3e84a191acdf5ec1680b6241e5bb'; // Varsayılan API key

// ImgBB API key'i al (localStorage'dan veya varsayılan değer)
export const getImgBBApiKey = (): string | null => {
  try {
    const stored = localStorage.getItem(IMGBB_API_KEY_STORAGE_KEY);
    // Eğer localStorage'da yoksa varsayılan değeri kullan
    return stored || DEFAULT_IMGBB_API_KEY;
  } catch (e) {
    // Hata durumunda varsayılan değeri döndür
    return DEFAULT_IMGBB_API_KEY;
  }
};

// ImgBB API key'i ayarla (localStorage'a kaydet)
export const setImgBBApiKey = (apiKey: string) => {
  try {
    localStorage.setItem(IMGBB_API_KEY_STORAGE_KEY, apiKey);
    console.log('ImgBB API key saved');
  } catch (e) {
    console.error('Error saving ImgBB API key:', e);
  }
};

export interface UploadedFile {
  id: string;
  name: string;
  type: string; // 'image' | 'pdf'
  data: string; // base64 encoded data
  size: number; // bytes
  uploadedAt: string; // ISO date string
}

const STORAGE_KEY = 'whatsapp_uploaded_files';

// Dosya yükleme
export const uploadFile = (file: File): Promise<UploadedFile> => {
  return new Promise((resolve, reject) => {
    // Dosya tipini kontrol et
    const isImage = file.type.startsWith('image/');
    const isPDF = file.type === 'application/pdf';
    
    if (!isImage && !isPDF) {
      reject(new Error('Sadece resim (JPG, PNG, GIF) veya PDF dosyaları yüklenebilir.'));
      return;
    }

    // Dosya boyutunu kontrol et
    // ImgBB limiti: 32MB (base64 encoding sonrası)
    // Base64 encoding dosyayı yaklaşık %33 büyütür
    // Güvenli limit: 20MB orijinal dosya (base64 sonrası ~26MB)
    const maxOriginalSize = 20 * 1024 * 1024; // 20MB
    if (file.size > maxOriginalSize) {
      reject(new Error(`Dosya boyutu çok büyük (${(file.size / 1024 / 1024).toFixed(2)} MB). ImgBB limiti için maksimum 20MB olmalıdır.`));
      return;
    }

    const reader = new FileReader();
    
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const fileData: UploadedFile = {
        id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        type: isImage ? 'image' : 'pdf',
        data: result,
        size: file.size,
        uploadedAt: new Date().toISOString()
      };

      // SessionStorage'a kaydet
      const existingFiles = getUploadedFiles();
      existingFiles.push(fileData);
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(existingFiles));

      resolve(fileData);
    };

    reader.onerror = () => {
      reject(new Error('Dosya okunurken hata oluştu.'));
    };

    // Base64 olarak oku
    reader.readAsDataURL(file);
  });
};

// Yüklenen dosyaları getir
export const getUploadedFiles = (): UploadedFile[] => {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error reading uploaded files:', error);
    return [];
  }
};

// Dosya sil
export const deleteFile = (fileId: string): void => {
  const files = getUploadedFiles();
  const filtered = files.filter(f => f.id !== fileId);
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};

// Tüm dosyaları sil
export const clearAllFiles = (): void => {
  sessionStorage.removeItem(STORAGE_KEY);
};

// Dosya URL'i oluştur (preview için)
export const getFileUrl = (file: UploadedFile): string => {
  return file.data; // Base64 data URL zaten hazır
};

// Dosya indirme linki oluştur
export const downloadFile = (file: UploadedFile): void => {
  const link = document.createElement('a');
  link.href = file.data;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Base64'ten File objesine çevir
export const base64ToFile = (base64: string, filename: string, mimeType: string): File => {
  const arr = base64.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || mimeType;
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};

// Dosyayı clipboard'a kopyala (WhatsApp'ta yapıştırmak için)
export const copyFileToClipboard = async (file: UploadedFile): Promise<boolean> => {
  try {
    // Base64'ten File objesine çevir
    const mimeType = file.type === 'image' 
      ? file.data.split(',')[0].match(/:(.*?);/)?.[1] || 'image/jpeg'
      : 'application/pdf';
    const fileObj = base64ToFile(file.data, file.name, mimeType);
    
    // Clipboard API ile dosyayı kopyala
    const clipboardItem = new ClipboardItem({
      [fileObj.type]: fileObj
    });
    
    await navigator.clipboard.write([clipboardItem]);
    return true;
  } catch (error) {
    console.error('Clipboard copy error:', error);
    return false;
  }
};

// Base64 data URL'i kısa bir link servisine yükle (opsiyonel)
// Şimdilik direkt data URL kullanacağız
export const getFileShareUrl = (file: UploadedFile): string => {
  // Base64 data URL'i direkt döndür
  // WhatsApp bazı durumlarda data URL'leri destekler
  return file.data;
};

// Base64 data URL'i kısa bir metin linkine çevir (WhatsApp için)
// NOT: Bu yöntem artık kullanılmıyor, sadece fallback olarak
export const createFileShareMessage = (file: UploadedFile, baseMessage: string): string => {
  // Base64 yöntemi WhatsApp'ta çalışmıyor, bu yüzden sadece bilgi veriyoruz
  return `${baseMessage}\n\n📎 Dosya: ${file.name} (${(file.size / 1024).toFixed(2)} KB)\n\n⚠️ Dosya yükleme başarısız oldu. Lütfen dosyayı manuel olarak gönderin.`;
};

// Sadece dosya için mesaj oluştur (mesaj metni olmadan)
// NOT: Bu yöntem artık kullanılmıyor, sadece fallback olarak
export const createFileOnlyMessage = (file: UploadedFile): string => {
  // Base64 yöntemi WhatsApp'ta çalışmıyor, bu yüzden sadece bilgi veriyoruz
  return `📎 ${file.name} (${(file.size / 1024).toFixed(2)} KB)\n\n⚠️ Dosya yükleme başarısız oldu. Lütfen dosyayı manuel olarak gönderin.`;
};

// Dosyayı ImgBB'e yükle ve public URL al
// ImgBB kullanıyoruz - ücretsiz, resim ve dosya hosting
export const uploadFileToHosting = async (file: UploadedFile): Promise<string> => {
  try {
    // ImgBB API key kontrolü
    const apiKey = getImgBBApiKey();
    if (!apiKey) {
      throw new Error('ImgBB API key tanımlanmamış. Lütfen dosya yükleme modalından API key\'i girin. API key almak için: https://api.imgbb.com/');
    }
    
    // ImgBB limiti: 32MB (base64 data URL için)
    const base64Size = file.data.length;
    const maxBase64Size = 32 * 1024 * 1024; // 32MB
    
    if (base64Size > maxBase64Size) {
      throw new Error(`Dosya çok büyük (${(base64Size / 1024 / 1024).toFixed(2)} MB). ImgBB limiti 32MB'dır.`);
    }
    
    // Base64 data URL'den sadece base64 kısmını al (data:image/jpeg;base64, kısmını kaldır)
    let base64String = file.data;
    if (file.data.includes(',')) {
      base64String = file.data.split(',')[1]; // Base64 string kısmını al
    }
    
    // FormData oluştur
    const formData = new FormData();
    formData.append('key', apiKey);
    formData.append('image', base64String);
    
    // ImgBB API'ye yükle
    const response = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('ImgBB upload error:', response.status, errorText);
      
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error?.message) {
          throw new Error(`ImgBB yükleme hatası: ${errorJson.error.message}`);
        }
      } catch (e) {
        // JSON parse edilemediyse direkt hata mesajını kullan
      }
      
      throw new Error(`ImgBB yükleme hatası (${response.status}): ${errorText || 'Bilinmeyen hata'}`);
    }
    
    const result = await response.json();
    
    if (!result.success || !result.data?.url) {
      console.error('ImgBB response:', result);
      throw new Error('ImgBB yanıtı beklenmedik formatta. URL alınamadı.');
    }
    
    const imageUrl = result.data.url;
    console.log('File uploaded successfully to ImgBB:', imageUrl);
    return imageUrl;
  } catch (error) {
    console.error('File upload error:', error);
    // Daha detaylı hata mesajı
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Dosya yüklenirken bilinmeyen bir hata oluştu. Lütfen tekrar deneyin.');
  }
};

// Dosya linki ile mesaj oluştur
export const createFileShareMessageWithLink = (baseMessage: string, fileUrl: string, fileName: string, fileType: string): string => {
  // ImgBB'den dosya linki direkt görüntülenebilir
  if (fileType === 'image') {
    return `${baseMessage}\n\n📷 ${fileName}\n\n${fileUrl}`;
  } else {
    return `${baseMessage}\n\n📄 ${fileName}\n\n🔗 ${fileUrl}`;
  }
};

// Sadece dosya linki ile mesaj oluştur
export const createFileOnlyMessageWithLink = (fileUrl: string, fileName: string, fileType: string): string => {
  if (fileType === 'image') {
    return `📷 ${fileName}\n\n${fileUrl}`;
  } else {
    return `📄 ${fileName}\n\n🔗 ${fileUrl}`;
  }
};

