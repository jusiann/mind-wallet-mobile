// ═══════════════════════════════════════════════════════════════
//  Engine Button Constants — Single Source of Truth
// ═══════════════════════════════════════════════════════════════

/** Evrensel yönlendirme butonları — her akış sonunda gösterilir */
export const NAV_BUTTONS = [
    { id: 'nav_analysis',    label: 'Bütçe Analizi',  icon: 'pie-chart-outline', payload: { action: 'start_analysis' } },
    { id: 'nav_transaction', label: 'İşlem Ekle',      icon: 'wallet-outline',    payload: { action: 'start_transaction' } },
    { id: 'nav_goal',        label: 'Hedef Oluştur',   icon: 'flag-outline',      payload: { action: 'start_goal' } },
    { id: 'nav_done',        label: 'Sohbeti Bitir',   icon: 'close-circle-outline', payload: { action: 'done' } },
];

/** İşlem akışı — onay butonları (payload'lar çağıran tarafça doldurulur) */
export const TX_CONFIRM_BUTTONS = (pendingData) => [
    { id: 'tx_confirm', label: 'Evet, kaydet', icon: 'checkmark-circle-outline', payload: { action: 'confirm_transaction', transaction: pendingData } },
    { id: 'tx_cancel',  label: 'İptal',        icon: 'close-circle-outline',     payload: { action: 'cancel' } },
];

/** İşlem akışı — başarı sonrası butonlar */
export const TX_SUCCESS_BUTTONS = [
    { id: 'tx_again',    label: 'Başka Ekle',     icon: 'add-circle-outline', payload: { action: 'start_transaction' } },
    { id: 'tx_analysis', label: 'Bütçemi İncele', icon: 'pie-chart-outline', payload: { action: 'start_analysis' } },
    { id: 'tx_done',     label: 'Bitir',           icon: 'close-circle-outline', payload: { action: 'done' } },
];

/** Hedef akışı — süre seçimi butonları (pendingGoalData çağıran tarafça eklenir) */
export const GOAL_DURATION_BUTTONS = (pendingGoalData) => [
    { id: 'dl_3m', label: '3 Ay',  icon: 'calendar-outline', payload: { action: 'set_deadline', months: 3,  pendingGoalData } },
    { id: 'dl_6m', label: '6 Ay',  icon: 'calendar-outline', payload: { action: 'set_deadline', months: 6,  pendingGoalData } },
    { id: 'dl_1y', label: '1 Yıl', icon: 'calendar-outline', payload: { action: 'set_deadline', months: 12, pendingGoalData } },
    { id: 'dl_2y', label: '2 Yıl', icon: 'calendar-outline', payload: { action: 'set_deadline', months: 24, pendingGoalData } },
];

/** Hedef akışı — onay butonları */
export const GOAL_CONFIRM_BUTTONS = (goalWithDeadline) => [
    { id: 'goal_confirm', label: 'Evet, oluştur', icon: 'checkmark-circle-outline', payload: { action: 'confirm_goal', goal: goalWithDeadline } },
    { id: 'goal_cancel',  label: 'İptal',          icon: 'close-circle-outline',     payload: { action: 'cancel' } },
];

/** Hedef durumu — ek aksiyon */
export const GOAL_STATUS_EXTRA_BUTTONS = [
    { id: 'gs_contribute', label: 'Hedefe Para Ekle', icon: 'cash-outline', payload: { action: 'start_goal_contribution' } },
];

/** Goal contribution — onay butonları */
export const GOAL_CONTRIB_CONFIRM_BUTTONS = (contribution) => [
    { id: 'contrib_yes', label: 'Evet, ekle', icon: 'checkmark-circle-outline', payload: { action: 'confirm_goal_contribution', contribution } },
    { id: 'contrib_no',  label: 'İptal',      icon: 'close-circle-outline',     payload: { action: 'cancel' } },
];

/** İptal sonrası gösterilecek butonlar */
export const CANCEL_BUTTONS = [
    { id: 'cancel_analysis',    label: 'Bütçe Analizi',  icon: 'pie-chart-outline', payload: { action: 'start_analysis' } },
    { id: 'cancel_transaction', label: 'İşlem Ekle',      icon: 'wallet-outline',    payload: { action: 'start_transaction' } },
    { id: 'cancel_goal',        label: 'Hedef Oluştur',   icon: 'flag-outline',      payload: { action: 'start_goal' } },
];
