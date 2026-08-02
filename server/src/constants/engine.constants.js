// ENGINE BUTTON CONSTANTS

// GLOBAL NAVIGATION BUTTONS
export const NAV_BUTTONS = [];

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
export const CANCEL_BUTTONS = [];

