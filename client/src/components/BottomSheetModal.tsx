import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Modal,
    PanResponder,
    StyleSheet,
    TouchableWithoutFeedback,
    View,
    KeyboardAvoidingView,
    Platform,
    Dimensions,
} from 'react-native';
import { COLORS } from '../constants/theme';

interface Props {
    visible: boolean;
    onClose: () => void;
    children: React.ReactNode;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function BottomSheetModal({ visible, onClose, children }: Props) {
    const [renderVisible, setRenderVisible] = useState(visible);
    const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            setRenderVisible(true);
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 240,
                    useNativeDriver: true,
                }),
                Animated.spring(translateY, {
                    toValue: 0,
                    bounciness: 2,
                    speed: 14,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(translateY, {
                    toValue: SCREEN_HEIGHT,
                    duration: 240,
                    useNativeDriver: true,
                }),
            ]).start(() => {
                setRenderVisible(false);
            });
        }
    }, [visible]);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gs) => gs.dy > 5,
            onPanResponderMove: (_, gs) => {
                if (gs.dy > 0) translateY.setValue(gs.dy);
            },
            onPanResponderRelease: (_, gs) => {
                if (gs.dy > 80 || gs.vy > 0.5) {
                    onClose();
                } else {
                    Animated.spring(translateY, {
                        toValue: 0,
                        bounciness: 0,
                        useNativeDriver: true,
                    }).start();
                }
            },
        })
    ).current;

    if (!renderVisible) return null;

    return (
        <Modal visible={renderVisible} transparent animationType="none" onRequestClose={onClose}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                {/* Dim backdrop - tap to close */}
                <TouchableWithoutFeedback onPress={onClose}>
                    <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
                </TouchableWithoutFeedback>

                {/* Floating card - has margins so it doesn't touch screen edges */}
                <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
                    {/* Handle bar */}
                    <View style={styles.handleContainer} {...panResponder.panHandlers}>
                        <View style={styles.handle} />
                    </View>

                    {/* Children content */}
                    <View style={styles.content}>
                        {children}
                    </View>
                </Animated.View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
    },
    sheet: {
        // Side margins so it floats and doesn't touch screen edges
        marginHorizontal: 12,
        marginBottom: Platform.OS === 'ios' ? 32 : 20,
        backgroundColor: COLORS.background,
        // All four corners rounded for the floating card effect
        borderRadius: 28,
        maxHeight: '88%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.18,
        shadowRadius: 20,
        elevation: 12,
        overflow: 'hidden',
    },
    handleContainer: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 20,
        paddingBottom: 20,
    },
    handle: {
        width: 44,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#C7C7CC',
    },
    content: {
        flexGrow: 1,
        flexShrink: 1,
        // Needed so ScrollView inside can measure its height
        overflow: 'hidden',
    },
});
