import { Resident, DebtBalance } from './types';

export const THEME_CONFIG = {
  // High quality architectural background from Unsplash (Luxury Apartment)
  backgroundImage: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=2070&auto=format&fit=crop",
  // Fallback color if image fails
  backgroundColor: "#1e293b"
};

// Aidat (aylık borç) WhatsApp şablonları — JSONBin'de saklanır; {name}, {residentName}, {id}, {amount}, {date}, {paymentDate}, {ownerName}
export interface MonthlyDebtWhatsAppTemplate {
  id: string;
  name: string;
  templateOwner: string;
  templateResident: string;
}

export const getDefaultMonthlyDebtWhatsAppTemplates = (): MonthlyDebtWhatsAppTemplate[] => [
  {
    id: 'standard',
    name: 'Standart Hatırlatma',
    templateOwner:
      "Şengel Residence Yönetimi'nden size bir mesaj var:\n\nSayın {name},\n\n{residentName} ({id}) numaralı dairenin {date} tarihi itibariyle toplam *{amount} TL* borcu bulunmaktadır.\n\nLütfen ödemenizi en kısa sürede yapınız.\nİyi günler dileriz.",
    templateResident:
      "Şengel Residence Yönetimi'nden size bir mesaj var:\n\nSayın {name},\n\n{date} tarihi itibariyle toplam *{amount} TL* borcunuz bulunmaktadır.\n\nLütfen ödemenizi en kısa sürede yapınız.\nİyi günler dileriz.",
  },
  {
    id: 'formal',
    name: 'Resmi Uyarı',
    templateOwner:
      "Şengel Residence Yönetimi'nden size bir mesaj var:\n\nSayın {name},\n\n{date} tarihi itibarıyla {residentName} ({id}) numaralı daireye ait geçmiş aylardan gelen toplam aidat borcu *{amount} TL* bulunduğu tespit edilmiştir. Söz konusu borcun {paymentDate} mesai bitimine kadar ödenmesi gerekmektedir. Belirtilen tarihe kadar ödeme yapılmaması durumunda, yasal işlem başlatılacak olup borcunuza yasa gereği aylık %5 gecikme faizi uygulanacaktır. Ayrıca tüm yargılama giderleri, harç ve avukatlık ücretleri tarafınıza tahakkuk ettirilecektir.\n\nŞengel Residence Yönetimi\n\n(Ödemenizi gerçekleştirdiyseniz lütfen bu mesajı dikkate almayınız.)",
    templateResident:
      "Şengel Residence Yönetimi'nden size bir mesaj var:\n\nSayın {name},\n\n{date} tarihi itibarıyla tarafınıza ait geçmiş aylardan gelen toplam aidat borcu *{amount} TL* bulunduğu tespit edilmiştir. Söz konusu borcun {paymentDate} mesai bitimine kadar ödenmesi gerekmektedir. Belirtilen tarihe kadar ödeme yapılmaması durumunda, yasal işlem başlatılacak olup borcunuza yasa gereği aylık %5 gecikme faizi uygulanacaktır. Ayrıca tüm yargılama giderleri, harç ve avukatlık ücretleri tarafınıza tahakkuk ettirilecektir.\n\nŞengel Residence Yönetimi\n\n(Ödemenizi gerçekleştirdiyseniz lütfen bu mesajı dikkate almayınız.)",
  },
  {
    id: 'friendly',
    name: 'Dostane Hatırlatma',
    templateOwner:
      "Şengel Residence Yönetimi'nden size bir mesaj var:\n\nMerhaba {name},\n\n{residentName} ({id}) numaralı dairenin {date} tarihi itibariyle *{amount} TL* borcu bulunuyor.\n\nÖdemenizi yaparsanız çok seviniriz. Teşekkürler! 😊",
    templateResident:
      "Şengel Residence Yönetimi'nden size bir mesaj var:\n\nMerhaba {name},\n\n{date} tarihi itibariyle *{amount} TL* borcunuz bulunuyor.\n\nÖdemenizi yaparsanız çok seviniriz. Teşekkürler! 😊",
  },
  {
    id: 'urgent',
    name: 'Acil Ödeme Talebi',
    templateOwner:
      "Şengel Residence Yönetimi'nden size bir mesaj var:\n\nSayın {name},\n\n⚠️ ACİL DURUM ⚠️\n\n{residentName} ({id}) numaralı dairenin {date} tarihi itibariyle toplam *{amount} TL* borcu bulunmaktadır.\n\nÖdemenizin 3 iş günü içinde yapılması gerekmektedir.\n\nAksi takdirde yasal süreç başlatılacaktır.\n\nŞengel Residence Yönetimi",
    templateResident:
      "Şengel Residence Yönetimi'nden size bir mesaj var:\n\nSayın {name},\n\n⚠️ ACİL DURUM ⚠️\n\n{date} tarihi itibariyle toplam *{amount} TL* borcunuz bulunmaktadır.\n\nÖdemenizin 3 iş günü içinde yapılması gerekmektedir.\n\nAksi takdirde yasal süreç başlatılacaktır.\n\nŞengel Residence Yönetimi",
  },
  {
    id: 'detailed',
    name: 'Detaylı Bilgilendirme',
    templateOwner:
      "Şengel Residence Yönetimi'nden size bir mesaj var:\n\nSayın {name},\n\n📋 Daire Bilgileri:\n   • Daire: {residentName}\n   • Hesap Kodu: {id}\n   • Borç Tutarı: *{amount} TL*\n   • Tarih: {date}\n\n💳 Ödeme Bilgileri:\n   Ödemelerinizi yaparken açıklama kısmına hesap kodunuzu ({id}) mutlaka yazınız.\n\n📞 İletişim:\n   Sorularınız için yönetim ofisine 09:00 - 18:00 saatleri arasında ulaşabilirsiniz.\n\nTeşekkürler,\nŞengel Residence Yönetimi",
    templateResident:
      "Şengel Residence Yönetimi'nden size bir mesaj var:\n\nSayın {name},\n\n📋 Hesap Bilgileri:\n   • Hesap Kodu: {id}\n   • Borç Tutarı: *{amount} TL*\n   • Tarih: {date}\n\n💳 Ödeme Bilgileri:\n   Ödemelerinizi yaparken açıklama kısmına hesap kodunuzu ({id}) mutlaka yazınız.\n\n📞 İletişim:\n   Sorularınız için yönetim ofisine 09:00 - 18:00 saatleri arasında ulaşabilirsiniz.\n\nTeşekkürler,\nŞengel Residence Yönetimi",
  },
];

export const formatMonthlyDebtWhatsAppMessage = (
  template: MonthlyDebtWhatsAppTemplate,
  resident: { name: string; id: string; ownerName?: string },
  amount: string,
  date: string,
  isOwnerMessage: boolean
): string => {
  const useOwner = isOwnerMessage && !!resident.ownerName;
  const raw = useOwner ? template.templateOwner : template.templateResident;
  const paymentDate = new Date();
  paymentDate.setDate(paymentDate.getDate() + 4);
  const paymentDateStr = paymentDate.toLocaleDateString('tr-TR');
  const name = useOwner && resident.ownerName ? resident.ownerName : resident.name;
  return raw
    .replace(/{name}/g, name)
    .replace(/{residentName}/g, resident.name)
    .replace(/{id}/g, resident.id)
    .replace(/{amount}/g, amount)
    .replace(/{date}/g, date)
    .replace(/{paymentDate}/g, paymentDateStr)
    .replace(/{ownerName}/g, resident.ownerName || '');
};

// WhatsApp Mesaj Şablonları - Doğalgaz Borcu için
export interface GasDebtWhatsAppTemplate {
  id: string;
  name: string;
  template: string; // Template string with placeholders: {name}, {id}, {amount}, {date}, {ownerName}, {residentName}
  // {residentName} is the actual resident name (for owner messages), {name} is the person receiving the message
}

// Default WhatsApp templates for gas debt - stored in localStorage, can be edited
export const getDefaultGasDebtWhatsAppTemplates = (): GasDebtWhatsAppTemplate[] => [
  {
    id: 'standard',
    name: 'Standart Hatırlatma',
    template: 'Şengel Residence Yönetimi\'nden size bir mesaj var:\n\nSayın {name},\n\n{residentName} ({id}) numaralı dairenin {date} tarihi itibariyle doğalgaz borcu *{amount} TL* bulunmaktadır.\n\nLütfen ödemenizi en kısa sürede yapınız.\nİyi günler dileriz.'
  },
  {
    id: 'formal',
    name: 'Resmi Uyarı',
    template: 'Şengel Residence Yönetimi\'nden size bir mesaj var:\n\nSayın {name},\n\n{date} tarihi itibarıyla {residentName} ({id}) numaralı daireye ait doğalgaz borcu *{amount} TL* bulunduğu tespit edilmiştir. Söz konusu borcun ödenmesi gerekmektedir.\n\nŞengel Residence Yönetimi'
  },
  {
    id: 'friendly',
    name: 'Dostane Hatırlatma',
    template: 'Şengel Residence Yönetimi\'nden size bir mesaj var:\n\nMerhaba {name},\n\n{residentName} ({id}) numaralı dairenin doğalgaz borcu *{amount} TL* bulunuyor.\n\nÖdemenizi yaparsanız çok seviniriz. Teşekkürler! 😊'
  },
  {
    id: 'urgent',
    name: 'Acil Ödeme Talebi',
    template: 'Şengel Residence Yönetimi\'nden size bir mesaj var:\n\nSayın {name},\n\n⚠️ ACİL DURUM ⚠️\n\n{residentName} ({id}) numaralı dairenin doğalgaz borcu *{amount} TL* bulunmaktadır.\n\nÖdemenizin 3 iş günü içinde yapılması gerekmektedir.\n\nŞengel Residence Yönetimi'
  }
];

/** Varsayılan doğalgaz şablonları (JSONBin'de kayıt yoksa kullanılır) */
export const getGasDebtWhatsAppTemplates = (): GasDebtWhatsAppTemplate[] => getDefaultGasDebtWhatsAppTemplates();

// Helper function to format gas debt WhatsApp message with placeholders
export const formatGasDebtWhatsAppMessage = (
  template: string,
  resident: { name: string; id: string; ownerName?: string },
  amount: string,
  date: string,
  isOwnerMessage: boolean = false
): string => {
  const name = isOwnerMessage && resident.ownerName ? resident.ownerName : resident.name;
  const residentName = resident.name; // Actual resident name (for owner messages, this is the tenant name)
  
  return template
    .replace(/{name}/g, name)
    .replace(/{residentName}/g, residentName)
    .replace(/{id}/g, resident.id)
    .replace(/{amount}/g, amount)
    .replace(/{date}/g, date)
    .replace(/{ownerName}/g, resident.ownerName || '');
};

// Helper function to extract username from id (131.001.001 -> 1)
const getUsernameFromId = (id: string): string => {
  const parts = id.split('.');
  if (parts.length > 0) {
    const lastPart = parts[parts.length - 1];
    // Remove leading zeros: "001" -> "1"
    return parseInt(lastPart).toString();
  }
  return id;
};

// Mock Data extracted from the provided OCR Text
// Values are cleaned (dots removed from thousands, commas replaced with dots for decimal)
// Converted to new schema: Resident (basic info) + DebtBalance (separate)
export const RESIDENTS_DATA: Resident[] = [
  { id: "131.001.001", name: "NAMIK KETHÜDA", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "1", password: "1234" },
  { id: "131.001.002", name: "SELVET DURUR", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "2", password: "1234" },
  { id: "131.001.003", name: "MELİS YILDIZ", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "3", password: "1234" },
  { id: "131.001.004", name: "YILDIZ ÇALIŞIR ( SİBEL KIZIL)", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "4", password: "1234" },
  { id: "131.001.005", name: "UĞUR ERAVCI", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "5", password: "1234" },
  { id: "131.001.006", name: "HAMDİYE ORTA", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "6", password: "1234" },
  { id: "131.001.007", name: "SANİYE KIRTI", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "7", password: "1234" },
  { id: "131.001.008", name: "ÖNDER YAYA (GAZİ AYGÜNEŞ ALTUNHAN)", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "8", password: "1234" },
  { id: "131.001.009", name: "AYŞE MERCAN YAĞCIOĞLU", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "9", password: "1234" },
  { id: "131.001.010", name: "BAHRİ GÜN", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "10", password: "1234" },
  { id: "131.001.011", name: "ARİF EKREM KÜÇÜK", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "11", password: "1234" },
  { id: "131.001.012", name: "YAKUP ŞAHİN", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "12", password: "1234" },
  { id: "131.001.013", name: "FATİH ŞENYENER (UĞUR EKİCİ)", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "13", password: "1234" },
  { id: "131.001.014", name: "MESUT AKKAYA", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "14", password: "1234" },
  { id: "131.001.015", name: "GÖKHAN DİKİCİ", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "15", password: "1234" },
  { id: "131.001.016", name: "F.SENEM KARAOKUTAN", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "16", password: "1234" },
  { id: "131.001.017", name: "ALİ RIZA YURT", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "17", password: "1234" },
  { id: "131.001.018", name: "MEHMET ÖZTÜRK", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "18", password: "1234" },
  { id: "131.001.019", name: "GÜLSÜM DEĞİRMENCİ (UFUK GÖVERCİ)", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "19", password: "1234" },
  { id: "131.001.020", name: "ENGİN KARAGÖZ", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "20", password: "1234" },
  { id: "131.001.021", name: "TACETTİN DÜZGÜN (MESUT ÇETİNER)", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "21", password: "1234" },
  { id: "131.001.022", name: "NİHAT ÇAĞATAY (FATİH GACAROĞLU)", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "22", password: "1234" },
  { id: "131.001.023", name: "YAŞAR PEHLİVAN", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "23", password: "1234" },
  { id: "131.001.024", name: "GENCER ERCAN (FATİH SOYLU)", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "24", password: "1234" },
  { id: "131.001.025", name: "ÖZLEM BASAL", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "25", password: "1234" },
  { id: "131.001.026", name: "TOLGA NAZLIAY", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "26", password: "1234" },
  { id: "131.001.027", name: "ÖMER OSMAN KÜLLÜ (BİRSEN ADEMOĞLU)", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "27", password: "1234" },
  { id: "131.001.028", name: "BAHAR NAZLIAY (MURAT ALTINBAŞ)", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "28", password: "1234" },
  { id: "131.001.029", name: "DUDU GÜL YILDIZ (KORAY EDİS)", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "29", password: "1234" },
  { id: "131.001.030", name: "ULAŞ FİDAN", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "30", password: "1234" },
  { id: "131.001.031", name: "ALİ BARIŞIK", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "31", password: "1234" },
  { id: "131.001.032", name: "ELEŞREF GÖKÇE (AHMET ARAT)", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "32", password: "1234" },
  { id: "131.001.033", name: "ALİ PINARLI", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "33", password: "1234" },
  { id: "131.001.034", name: "SEVİLAY MERMEROĞLU", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "34", password: "1234" },
  { id: "131.001.035", name: "YUNUS DÜLGAR", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "35", password: "1234" },
  { id: "131.001.036", name: "ÖZEN TOPLAMA", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "36", password: "1234" },
  { id: "131.001.037", name: "HÜSEYİN GÜNGÖR", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "37", password: "1234" },
  { id: "131.001.038", name: "SERKAN AKMEŞE", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "38", password: "1234" },
  { id: "131.001.039", name: "SEMA ÖZDEN", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "39", password: "1234" },
  { id: "131.001.040", name: "FATOŞ TURNA", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "40", password: "1234" },
  { id: "131.001.041", name: "ÖZLEM BİÇER (AYTEKİN ÇAYBAKAN)", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "41", password: "1234" },
  { id: "131.001.042", name: "BEYHAN KARAKIVRAK (PERVİN AY)", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "42", password: "1234" },
  { id: "131.001.043", name: "GÜRKAN DURAK", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "43", password: "1234" },
  { id: "131.001.044", name: "İBRAHİM TAŞYÜREK (HALİT SOY)", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "44", password: "1234" },
  { id: "131.001.045", name: "MUSTAFA ÜSTBAŞ", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "45", password: "1234" },
  { id: "131.001.046", name: "RIFAT TOROS", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "46", password: "1234" },
  { id: "131.001.047", name: "İLYAS CAN", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "47", password: "1234" },
  { id: "131.001.048", name: "FATMA KIRAN", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "48", password: "1234" },
  { id: "131.001.049", name: "FELİKNAZ ÇAĞATAY", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "49", password: "1234" },
  { id: "131.001.050", name: "SUNAY ANGELİQUNE ŞENGÜL", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "50", password: "1234" },
  { id: "131.001.051", name: "SEMRA ÇİÇEK", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "51", password: "1234" },
  { id: "131.001.052", name: "SAMİ CAN UÇAROĞLU", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "52", password: "1234" },
  { id: "131.001.053", name: "İBRAHİM TAŞYÜREK", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "53", password: "1234" },
  { id: "131.001.054", name: "YUNUS LENGERANLI (NEVZAT ALIÇ)", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "54", password: "1234" },
  { id: "131.001.055", name: "AHMET TOPBAŞ", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "55", password: "1234" },
  { id: "131.001.056", name: "NUSRET ÖZDEMİR", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "56", password: "1234" },
  { id: "131.001.057", name: "YEMLİHA ZAYIF", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "57", password: "1234" },
  { id: "131.001.058", name: "SABİHA GÜREL", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "58", password: "1234" },
  { id: "131.001.059", name: "NAZİFE UYSAL", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "59", password: "1234" },
  { id: "131.001.060", name: "GENCER ERCAN", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "60", password: "1234" },
  { id: "131.001.061", name: "HALİL AYDIN", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "61", password: "1234" },
  { id: "131.001.062", name: "ELİF GÖKÇE TÜLÜCE)", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "62", password: "1234" },
  { id: "131.001.063", name: "NAHİBE CAN", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "63", password: "1234" },
  { id: "131.001.064", name: "NURTEN AVCI", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "64", password: "1234" },
  { id: "131.001.065", name: "ERTAN GÜNDÜZ", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "65", password: "1234" },
  { id: "131.001.066", name: "HAMİT ÇALLIOĞLU", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "66", password: "1234" },
  { id: "131.001.067", name: "ALİ ÜSTÜN", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "67", password: "1234" },
  { id: "131.001.068", name: "CENGİZ AYDIN", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "68", password: "1234" },
  { id: "131.001.069", name: "ERDAL BİLİCELİ", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "69", password: "1234" },
  { id: "131.001.070", name: "MÜGE KUTLUAY AYGÜN", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "70", password: "1234" },
  { id: "131.001.071", name: "ŞEVKİ ÇAĞLIYAN", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "71", password: "1234" },
  { id: "131.001.072", name: "ABDİL KİLLİ (KORHAN ELMACI)", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "72", password: "1234" },
  { id: "131.001.073", name: "SERKAN PARLAK", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "73", password: "1234" },
  { id: "131.001.074", name: "HATİCE ÖNERBAY", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "74", password: "1234" },
  { id: "131.001.075", name: "MELİKE MENEND YÖRÜK ( KİRACI", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "75", password: "1234" },
  { id: "131.001.076", name: "OKÇUOĞLU HARFİYAT (MUHAMMED YILMAZ KİRACI)", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "76", password: "1234" },
  { id: "131.001.077", name: "SERKAN ÇETİNKAYA", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "77", password: "1234" },
  { id: "131.001.078", name: "NİLGÜN ÇEKİN", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "78", password: "1234" },
  { id: "131.001.079", name: "MEHMET GÜNGÖRMÜŞ", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "79", password: "1234" },
  { id: "131.001.080", name: "EBRU DERGİCİ", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "80", password: "1234" },
  { id: "131.001.081", name: "HANDE UNCULU", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "81", password: "1234" },
  { id: "131.001.082", name: "ÖZER ERDOĞAN", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "82", password: "1234" },
  { id: "131.001.083", name: "NURİ ALP YAĞCI", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "83", password: "1234" },
  { id: "131.001.084", name: "KANİ ÖZDEMİR", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "84", password: "1234" },
  { id: "131.001.085", name: "ŞENGÜL ESİN", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "85", password: "1234" },
  { id: "131.001.086", name: "OKÇUOĞLU HARFİYAT (ELVAN SARIBIYIK)", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "86", password: "1234" },
  { id: "131.001.087", name: "TÜLAY ÖZEGEMEN", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "87", password: "1234" },
  { id: "131.001.088", name: "SEYFİ KILIÇ", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "88", password: "1234" },
  { id: "131.001.089", name: "UĞUR GÜNGÖRMÜŞ", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "89", password: "1234" },
  { id: "131.001.090", name: "HEDİYE GÖZDE KOYUNCU", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "90", password: "1234" },
  { id: "131.001.091", name: "AHMET YENİGÜN", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "91", password: "1234" },
  { id: "131.001.092", name: "DERYA SAĞLAM", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "92", password: "1234" },
  { id: "131.001.093", name: "GÜLTEKİN KAZANCI", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "93", password: "1234" },
  { id: "131.001.094", name: "FARUK GÜNGÖR", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "94", password: "1234" },
  { id: "131.001.095", name: "ÜMİT ARI", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "95", password: "1234" },
  { id: "131.001.096", name: "NEŞE ŞENOĞLU ERKARA", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "96", password: "1234" },
  { id: "131.001.097", name: "NEZAHAT GECEKUŞLU", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "97", password: "1234" },
  { id: "131.001.098", name: "ENDER RAŞİT YAYA (HÜSEYİN TAŞ)", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "98", password: "1234" },
  { id: "131.001.099", name: "YUNUS DEMİRTAŞ", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "99", password: "1234" },
  { id: "131.001.100", name: "SEMİH SAĞLAM", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "100", password: "1234" },
  { id: "131.001.101", name: "ECE BOMBACI (YAĞMUR AYÇE KAYA)", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "101", password: "1234" },
  { id: "131.001.102", name: "KAYA DİNÇ BOSTANCI (M.TALHA YAKUTER)", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "102", password: "1234" },
  { id: "131.001.103", name: "BARTU YASLI", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "103", password: "1234" },
  { id: "131.001.104", name: "YUSUF GÜRTEKİN", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "104", password: "1234" },
  { id: "131.001.105", name: "NECATİ -HÜLYA ONAY (SEVENLER DAĞITIM)", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "105", password: "1234" },
  { id: "131.001.106", name: "ALİ KARAHAN", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "106", password: "1234" },
  { id: "131.001.107", name: "GÜLÜMSER KAPLAN", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "107", password: "1234" },
  { id: "131.001.108", name: "SEVTAP KOZALI ÖZSEZ", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "108", password: "1234" },
  { id: "131.001.109", name: "SELÇUK AKGÜL", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "109", password: "1234" },
  { id: "131.001.110", name: "GÖRKEM GÜREL SARAL", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "110", password: "1234" },
  { id: "131.001.111", name: "MUSTAFA HAYIT (OKAN ALTINOVA)", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "111", password: "1234" },
  { id: "131.001.112", name: "İSMAİL BOZKURT", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "112", password: "1234" },
  { id: "131.001.113", name: "GÜRAY TORUK", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "113", password: "1234" },
  { id: "131.001.114", name: "YUNUS DÜRGAR", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "114", password: "1234" },
  { id: "131.001.115", name: "ONUR ÇIRAK", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "115", password: "1234" },
  { id: "131.001.116", name: "SÜLÜN USTA", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "116", password: "1234" },
  { id: "131.001.117", name: "YUSUF ARSLAN", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "117", password: "1234" },
  { id: "131.001.118", name: "TOLGA ALTINKAYNAK", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "118", password: "1234" },
  { id: "131.001.119", name: "EYÜP MURAT TORT", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "119", password: "1234" },
  { id: "131.001.120", name: "TURGAY ERTİRYAKİ", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "120", password: "1234" },
  { id: "131.001.121", name: "Ş. ZEKİ BOZKURT", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "121", password: "1234" },
  { id: "131.001.122", name: "ABDİL OZAN ÖZKAN (ONUR KEYİFLİ)", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "122", password: "1234" },
  { id: "131.001.123", name: "ŞOK A.Ş.", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "123", password: "1234" },
  { id: "131.001.124", name: "RIKFI YÖRÜK", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "124", password: "1234" },
  { id: "131.001.127", name: "DENİZBANK A.Ş. 121 NOLU", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "127", password: "1234" },
  { id: "131.001.129", name: "OKÇUOĞLU HAFRİYAT 76 NOLU DAİRE EK ÖDEME BORÇLARI", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "129", password: "1234" },
  { id: "131.001.130", name: "OKÇUOĞLU HAFRİYAT 86 NOLU DAİRE EK ÖDEME BORÇLARI", phone: undefined, isOwner: true, ownerPhone: undefined, ownerName: undefined, username: "130", password: "1234" },
];

// Debt balances - separate from residents
export const DEBT_BALANCES_DATA: DebtBalance[] = [
  { id: "131.001.001", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.002", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.003", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.004", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.005", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.006", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.007", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.008", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.009", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.010", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.011", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.012", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.013", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.014", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.015", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.016", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.017", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.018", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.019", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.020", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.021", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.022", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.023", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.024", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.025", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.026", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.027", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.028", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.029", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.030", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.031", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.032", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.033", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.034", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.035", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.036", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.037", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.038", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.039", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.040", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.041", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.042", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.043", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.044", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.045", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.046", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.047", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.048", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.049", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.050", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.051", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.052", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.053", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.054", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.055", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.056", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.057", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.058", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.059", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.060", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.061", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.062", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.063", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.064", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.065", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.066", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.067", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.068", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.069", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.070", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.071", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.072", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.073", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.074", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.075", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.076", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.077", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.078", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.079", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.080", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.081", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.082", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.083", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.084", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.085", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.086", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.087", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.088", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.089", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.090", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.091", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.092", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.093", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.094", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.095", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.096", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.097", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.098", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.099", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.100", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.101", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.102", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.103", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.104", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.105", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.106", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.107", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.108", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.109", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.110", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.111", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.112", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.113", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.114", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.115", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.116", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.117", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.118", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.119", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.120", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.121", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.122", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.123", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.124", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.127", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.129", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
  { id: "131.001.130", totalDebit: 0, totalCredit: 0, debtBalance: 0, creditBalance: 0 },
];
