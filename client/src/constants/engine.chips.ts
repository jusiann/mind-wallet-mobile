/**
 * AI Hub başlangıç chip sabitleri.
 * Her chip sendAction() üzerinden /action endpoint'ine gider — Gemini çağrılmaz.
 */
export interface EngineChip {
    label: string;
    icon: any; // Add icon support for Ionicons
    payload: Record<string, unknown>;
}

export const ENGINE_CHIPS: EngineChip[] = [
    { label: 'Yeni harcama ekle',    icon: 'wallet-outline',    payload: { action: 'start_transaction' } },
    { label: 'Hedef oluştur',        icon: 'flag-outline',      payload: { action: 'start_goal' } },
    { label: 'Aylık durumum nasıl?', icon: 'pie-chart-outline', payload: { action: 'start_analysis' } },
    { label: 'Tasarruf tavsiyesi ver',icon: 'bulb-outline',     payload: { action: 'get_tips' } },
];
