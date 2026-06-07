import { create } from 'zustand';
import { apiFetch } from '../constants/api';

export interface EngineButton {
    id: string;
    label: string;
    icon?: string;
    payload: Record<string, unknown>;
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'mindy';
    content: string;
    buttons?: EngineButton[];
    classification?: string | null;
    status: 'sent' | 'pending' | 'done' | 'error';
    warning?: string | null;
}

export interface EngineResponse {
    message: string;
    buttons: EngineButton[] | null;
    classification: string | null;
    label: string | null;
    detected_savings: number | null;
    wasteful_categories: string[] | null;
    optimized_route: { goalId: number; amount: number } | null;
    warning: string | null;
}

interface EngineState {
    messages: ChatMessage[];
    isTyping: boolean;
    isActionPending: boolean;
    selectedByMessage: Record<string, string>;
    lockedMessageIds: Set<string>;
    pendingActionSourceId: string | null;

    needsRefresh: boolean;
    markNeedsRefresh: () => void;
    consumeRefresh: () => boolean;

    sendChat: (text: string) => Promise<void>;
    sendAction: (payload: Record<string, unknown>, buttonId?: string, sourceMsgId?: string) => Promise<void>;
    resetConversation: () => void;
    retryLastChat: () => Promise<void>;

    pendingChat: string | null;
    setPendingChat: (msg: string) => void;
    takePendingChat: () => string | null;
}

function buildHistory(messages: ChatMessage[]) {
    return messages
        .filter((m) => m.status === 'done' || m.status === 'sent')
        .map((m) => ({
            role: m.role === 'user' ? ('user' as const) : ('model' as const),
            content: m.content,
        }))
        .slice(-20);
}

export const useEngineStore = create<EngineState>((set, get) => ({
    messages: [],
    isTyping: false,
    isActionPending: false,
    selectedByMessage: {},
    lockedMessageIds: new Set(),
    pendingActionSourceId: null,

    needsRefresh: false,
    markNeedsRefresh: () => set({ needsRefresh: true }),
    consumeRefresh: () => {
        const state = get();
        if (state.needsRefresh) {
            set({ needsRefresh: false });
            return true;
        }
        return false;
    },

    resetConversation: () => {
        set({
            messages: [],
            isTyping: false,
            isActionPending: false,
            selectedByMessage: {},
            lockedMessageIds: new Set(),
            pendingActionSourceId: null,
        });
    },

    pendingChat: null,
    setPendingChat: (msg: string) => set({ pendingChat: msg }),
    takePendingChat: () => {
        const state = get();
        const msg = state.pendingChat;
        if (msg) set({ pendingChat: null });
        return msg;
    },

    sendChat: async (text: string) => {
        const { messages } = get();
        
        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: text.trim(),
            status: 'sent',
        };

        set({
            messages: [...messages, userMsg],
            isTyping: true,
        });

        try {
            const res = await apiFetch<{ success: boolean; data: EngineResponse }>('/engine/chat', {
                method: 'POST',
                body: JSON.stringify({ input: text.trim(), history: buildHistory(get().messages) }),
            });

            const mindyMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'mindy',
                content: res.data.message,
                buttons: res.data.buttons ?? undefined,
                classification: res.data.classification,
                status: 'done',
                warning: res.data.warning,
            };

            set((state) => ({
                messages: [...state.messages, mindyMsg],
                isTyping: false,
            }));
        } catch (error: any) {
            const errorMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'mindy',
                content: error.message?.includes('AI service')
                    ? 'Yapay zeka servisi şu an yoğun. Birazdan tekrar deneyin.'
                    : 'Bir hata oluştu. Lütfen tekrar dene.',
                status: 'error',
            };
            set((state) => ({
                messages: [...state.messages, errorMsg],
                isTyping: false,
            }));
        }
    },

    sendAction: async (payload: Record<string, unknown>, buttonId?: string, sourceMsgId?: string) => {
        // done → sıfırla, backend'e gitme
        if (payload.action === 'done') {
            get().resetConversation();
            return;
        }

        const { messages, selectedByMessage, lockedMessageIds } = get();

        // 1. Mark button as selected (only if from a button press, not a chip)
        let newSelected = selectedByMessage;
        if (buttonId && sourceMsgId) {
            newSelected = { ...selectedByMessage, [sourceMsgId]: buttonId };
        }

        // 2. Lock previous messages (only if from button press)
        const newLocked = new Set(lockedMessageIds);
        if (buttonId) {
            messages.forEach((m) => newLocked.add(m.id));
        }

        set({
            selectedByMessage: newSelected,
            lockedMessageIds: newLocked,
            isActionPending: true,
            pendingActionSourceId: sourceMsgId || null,
        });

        try {
            const res = await apiFetch<{ success: boolean; data: EngineResponse }>('/engine/action', {
                method: 'POST',
                body: JSON.stringify({ buttonPayload: payload, history: buildHistory(messages) }),
            });

            const mindyMsg: ChatMessage = {
                id: Date.now().toString(),
                role: 'mindy',
                content: res.data.message,
                buttons: res.data.buttons ?? undefined,
                classification: res.data.classification,
                status: 'done',
                warning: res.data.warning,
            };

            const MUTATING_ACTIONS = [
                'confirm_transaction', 'confirm_goal', 'confirm_goal_contribution',
                'confirm_routing', 'confirm_pledge',
            ];
            const shouldRefresh = MUTATING_ACTIONS.includes(payload.action as string);

            set((state) => ({
                messages: [...state.messages, mindyMsg],
                isActionPending: false,
                pendingActionSourceId: null,
                needsRefresh: shouldRefresh ? true : state.needsRefresh,
            }));
        } catch (error: any) {
            const errorMsg: ChatMessage = {
                id: Date.now().toString(),
                role: 'mindy',
                content: 'İşlem gerçekleştirilemedi. ' + (error.message || 'Lütfen tekrar dene.'),
                status: 'error',
            };
            set((state) => ({
                messages: [...state.messages, errorMsg],
                isActionPending: false,
                pendingActionSourceId: null,
            }));
        }
    },

    retryLastChat: async () => {
        const { messages, sendChat } = get();
        // Find last user message
        const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
        
        // Remove the error message from the list
        set({
            messages: messages.filter(m => m.status !== 'error')
        });

        if (lastUserMsg) {
            // Re-send it but without adding it to the list again
            set({ isTyping: true });
            try {
                const res = await apiFetch<{ success: boolean; data: EngineResponse }>('/engine/chat', {
                    method: 'POST',
                    body: JSON.stringify({ input: lastUserMsg.content, history: buildHistory(get().messages) }),
                });

                const mindyMsg: ChatMessage = {
                    id: (Date.now() + 1).toString(),
                    role: 'mindy',
                    content: res.data.message,
                    buttons: res.data.buttons ?? undefined,
                    classification: res.data.classification,
                    status: 'done',
                    warning: res.data.warning,
                };

                set((state) => ({
                    messages: [...state.messages, mindyMsg],
                    isTyping: false,
                }));
            } catch (error: any) {
                const errorMsg: ChatMessage = {
                    id: (Date.now() + 1).toString(),
                    role: 'mindy',
                    content: error.message?.includes('AI service')
                        ? 'Yapay zeka servisi şu an yoğun. Birazdan tekrar deneyin.'
                        : 'Bir hata oluştu. Lütfen tekrar dene.',
                    status: 'error',
                };
                set((state) => ({
                    messages: [...state.messages, errorMsg],
                    isTyping: false,
                }));
            }
        }
    }
}));
