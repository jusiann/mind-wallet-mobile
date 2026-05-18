import { useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, TYPOGRAPHY } from './theme';

interface AlertConfig {
    title: string;
    message?: string;
    onCancel?: () => void;
    confirm?: {
        label: string;
        onPress: () => void;
        destructive?: boolean;
        hideCancel?: boolean;
        cancelLabel?: string;
    };
}

export function useAlert() {
    const [config, setConfig] = useState<AlertConfig | null>(null);

    function showAlert(cfg: AlertConfig) {
        setConfig(cfg);
    }

    function dismiss() {
        setConfig(null);
    }

    function cancel() {
        const cb = config?.onCancel;
        setConfig(null);
        cb?.();
    }

    const alertEl = config ? (
        <Modal visible transparent animationType="fade" onRequestClose={cancel}>
            <View style={s.overlay}>
                <View style={s.card}>
                    <Text style={s.title}>{config.title}</Text>
                    {config.message ? (
                        <Text style={s.message}>{config.message}</Text>
                    ) : null}
                    <View style={s.actions}>
                        {config.confirm ? (
                            <>
                                {!config.confirm.hideCancel && (
                                    <TouchableOpacity style={s.actionBtn} onPress={cancel}>
                                        <Text style={s.cancelText}>
                                            {config.confirm.cancelLabel ?? 'İptal'}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity
                                    style={s.actionBtn}
                                    onPress={() => {
                                        dismiss();
                                        config.confirm!.onPress();
                                    }}
                                >
                                    <Text
                                        style={[
                                            s.confirmText,
                                            config.confirm.destructive && s.destructiveText,
                                        ]}
                                    >
                                        {config.confirm.label}
                                    </Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <TouchableOpacity style={s.actionBtn} onPress={dismiss}>
                                <Text style={s.confirmText}>Tamam</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    ) : null;

    return { showAlert, alertEl };
}

const s = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    card: {
        width: '100%',
        backgroundColor: COLORS.surfaceContainerLowest,
        borderRadius: 20,
        paddingTop: 24,
        paddingHorizontal: 24,
        paddingBottom: 8,
    },
    title: {
        ...TYPOGRAPHY.labelMd,
        fontFamily: 'HankenGrotesk_600SemiBold',
        fontSize: 16,
        color: COLORS.textPrimary,
        marginBottom: 6,
    },
    message: {
        ...TYPOGRAPHY.labelMd,
        color: COLORS.textSecondary,
        marginBottom: 4,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 12,
        gap: 4,
    },
    actionBtn: {
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    cancelText: {
        ...TYPOGRAPHY.labelMd,
        color: COLORS.textSecondary,
    },
    confirmText: {
        ...TYPOGRAPHY.labelMd,
        color: COLORS.primary,
        fontFamily: 'HankenGrotesk_600SemiBold',
    },
    destructiveText: {
        color: COLORS.error,
    },
});
