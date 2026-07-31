// ENGINE BUTTON CONSTANTS

// GLOBAL NAVIGATION BUTTONS
export const NAV_BUTTONS = [
    { id: 'nav_analysis',    label: 'Bütçe Analizi',  icon: 'pie-chart-outline', payload: { action: 'start_analysis' } },
    { id: 'nav_transaction', label: 'İşlem Ekle',      icon: 'wallet-outline',    payload: { action: 'start_transaction' } },
    { id: 'nav_goal',        label: 'Hedef Oluştur',   icon: 'flag-outline',      payload: { action: 'start_goal' } },
    { id: 'nav_done',        label: 'Sohbeti Bitir',   icon: 'close-circle-outline', payload: { action: 'done' } },
];

// TRANSACTION CONFIRMATION BUTTONS
export const TX_CONFIRM_BUTTONS = (pendingData) => [
    { id: 'tx_confirm', label: 'Evet, kaydet', icon: 'checkmark-circle-outline', payload: { action: 'confirm_transaction', transaction: pendingData } },
    { id: 'tx_cancel',  label: 'İptal',        icon: 'close-circle-outline',     payload: { action: 'cancel' } },
];

// TRANSACTION SUCCESS BUTTONS
export const TX_SUCCESS_BUTTONS = [
    { id: 'tx_again',    label: 'Başka Ekle',     icon: 'add-circle-outline', payload: { action: 'start_transaction' } },
    { id: 'tx_analysis', label: 'Bütçemi İncele', icon: 'pie-chart-outline', payload: { action: 'start_analysis' } },
    { id: 'tx_done',     label: 'Bitir',           icon: 'close-circle-outline', payload: { action: 'done' } },
];

// GOAL DURATION SELECTION BUTTONS
export const GOAL_DURATION_BUTTONS = (pendingGoalData) => [
    { id: 'dl_3m', label: '3 Ay',  icon: 'calendar-outline', payload: { action: 'set_deadline', months: 3,  pendingGoalData } },
    { id: 'dl_6m', label: '6 Ay',  icon: 'calendar-outline', payload: { action: 'set_deadline', months: 6,  pendingGoalData } },
    { id: 'dl_1y', label: '1 Yıl', icon: 'calendar-outline', payload: { action: 'set_deadline', months: 12, pendingGoalData } },
    { id: 'dl_2y', label: '2 Yıl', icon: 'calendar-outline', payload: { action: 'set_deadline', months: 24, pendingGoalData } },
];

// GOAL CONFIRMATION BUTTONS
export const GOAL_CONFIRM_BUTTONS = (goalWithDeadline) => [
    { id: 'goal_confirm', label: 'Evet, oluştur', icon: 'checkmark-circle-outline', payload: { action: 'confirm_goal', goal: goalWithDeadline } },
    { id: 'goal_cancel',  label: 'İptal',          icon: 'close-circle-outline',     payload: { action: 'cancel' } },
];

// GOAL STATUS EXTRA ACTION BUTTONS
export const GOAL_STATUS_EXTRA_BUTTONS = [
    { id: 'gs_contribute', label: 'Hedefe Para Ekle', icon: 'cash-outline', payload: { action: 'start_goal_contribution' } },
];

// GOAL CONTRIBUTION CONFIRMATION BUTTONS
export const GOAL_CONTRIB_CONFIRM_BUTTONS = (contribution) => [
    { id: 'contrib_yes', label: 'Evet, ekle', icon: 'checkmark-circle-outline', payload: { action: 'confirm_goal_contribution', contribution } },
    { id: 'contrib_no',  label: 'İptal',      icon: 'close-circle-outline',     payload: { action: 'cancel' } },
];

// CANCEL BUTTONS
export const CANCEL_BUTTONS = [
    { id: 'cancel_analysis',    label: 'Bütçe Analizi',  icon: 'pie-chart-outline', payload: { action: 'start_analysis' } },
    { id: 'cancel_transaction', label: 'İşlem Ekle',      icon: 'wallet-outline',    payload: { action: 'start_transaction' } },
    { id: 'cancel_goal',        label: 'Hedef Oluştur',   icon: 'flag-outline',      payload: { action: 'start_goal' } },
];

// CHITCHAT MESSAGES
export const CHITCHAT_MESSAGES = [
    'Merhaba! Ben Mindy, senin finansal asistanın. Sana nasıl yardımcı olabilirim?',
    'Selam! Bugün bütçen hakkında konuşmak ister misin?',
    'Hoş geldin! Harcamalarını analiz edeyim mi, yoksa başka bir konuda yardımcı olayım mı?',
];

// OUT OF SCOPE MESSAGES
export const OUT_OF_SCOPE_MESSAGES = [
    'Üzgünüm, ben Mind Wallet\'ın finansal asistanı Mindy\'yim!\nBütçe analizi, işlem kaydı ve tasarruf hedefleri konularında yardımcı olabilirim.\n\nSana nasıl yardımcı olabilirim?',
    'Bu konuda yardımcı olamıyorum ama finansal konularda buradayım!\nHarcamalarını analiz etmek, hedef oluşturmak veya tasarruf tavsiyeleri almak ister misin?',
    'Benim uzmanlık alanım kişisel finans.\nBütçen hakkında sohbet edelim mi? İşlem kaydı veya hedef takibi yapabilirim.',
];

// TX START MESSAGES
export const TX_START_MESSAGES = [
    'Tabii! Ne kadar harcadın veya ne kadar gelir aldın?\n(Örn: "Markete 250 TL harcadım" veya "15.000 TL maaş yattı")',
    'Hemen kaydedelim! Harcama veya gelir tutarını yaz.\n(Örn: "Kafe 80 TL" veya "Freelance 5.000 TL gelir")',
    'Yeni işlem ekleyelim! Ne harcadın veya ne kazandın?\n(Örn: "Market alışverişi 320 TL" veya "Maaş 25.000 TL")',
];

// GOAL START MESSAGES
export const GOAL_START_MESSAGES = [
    'Harika! Ne için ve ne kadar biriktirmek istiyorsun?\n(Örn: "Tatil için 15.000 TL biriktirmek istiyorum")',
    'Yeni bir hedef oluşturalım! Neyin için ne kadar biriktirmek istiyorsun?\n(Örn: "Araba için 100.000 TL")',
    'Hedef belirleyelim! Bana hedefinin adını ve tutarını söyle.\n(Örn: "Acil durum fonu 20.000 TL")',
];

// UNKNOWN ACTION MESSAGES
export const UNKNOWN_ACTION_MESSAGES = [
    'Bu işlemi anlayamadım. Ne yapmak istersin?',
    'Bunu tam çözemedim. Sana nasıl yardımcı olabilirim?',
    'Anlamadım, bir daha açıklar mısın? İşte yapabileceklerim:',
];

// FALLBACK MESSAGES
export const FALLBACK_MESSAGES = [
    'Bu işlemi anlayamadım. Ne yapmak istersin?',
    'Tam anlayamadım. Aşağıdaki seçeneklerden birini dene!',
    'Bunu çözemedim ama şunlardan biriyle yardımcı olabilirim:',
];

// CANCEL MESSAGES
export const CANCEL_MESSAGES = [
    'İptal edildi. Başka ne yapabilirim?',
    'Tamam, iptal ettim. Sana başka nasıl yardımcı olabilirim?',
    'İptal edildi! Başka bir işlem yapmak ister misin?',
];

// DONE MESSAGES
export const DONE_MESSAGES = [
    'Görüşmek üzere!',
    'İyi günler! İhtiyacın olursa buradayım.',
    'Tekrar görüşmek üzere! Kendine iyi bak.',
];
