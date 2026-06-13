import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Animated,
    Keyboard,
    Modal,
    PanResponder,
    Platform,
    StyleSheet,
    TouchableWithoutFeedback,
    View,
    Dimensions,
} from 'react-native';
import { COLORS } from '../constants/theme';

interface Props {
    visible: boolean;
    onClose: () => void;
    children: React.ReactNode;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;
const DISMISS_THRESHOLD = 80;
const VELOCITY_THRESHOLD = 0.5;

export default function BottomSheetModal({ visible, onClose, children }: Props) {
    const [showModal, setShowModal] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

    // Keep refs fresh to avoid stale closures in PanResponder
    const onCloseRef = useRef(onClose);
    useEffect(() => { onCloseRef.current = onClose; });

    const isClosingRef = useRef(false);

    const animateOut = useCallback(() => {
        if (isClosingRef.current) return;
        isClosingRef.current = true;
        Keyboard.dismiss();

        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(translateY, {
                toValue: SCREEN_HEIGHT,
                duration: 250,
                useNativeDriver: true,
            }),
        ]).start(() => {
            setShowModal(false);
            isClosingRef.current = false;
            onCloseRef.current();
        });
    }, [fadeAnim, translateY]);

    // Keep animateOut ref fresh for PanResponder
    const animateOutRef = useRef(animateOut);
    useEffect(() => { animateOutRef.current = animateOut; });

    const animateIn = useCallback(() => {
        fadeAnim.setValue(0);
        translateY.setValue(SCREEN_HEIGHT);

        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 250,
                useNativeDriver: true,
            }),
            Animated.spring(translateY, {
                toValue: 0,
                bounciness: 2,
                speed: 14,
                useNativeDriver: true,
            }),
        ]).start();
    }, [fadeAnim, translateY]);

    useEffect(() => {
        if (visible) {
            isClosingRef.current = false;
            fadeAnim.setValue(0);
            translateY.setValue(SCREEN_HEIGHT);
            setShowModal(true);
        } else if (showModal) {
            animateOut();
        }
    }, [visible]);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onStartShouldSetPanResponderCapture: () => true,
            onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dy) > 5,
            onMoveShouldSetPanResponderCapture: (_, gs) => Math.abs(gs.dy) > 5,
            onPanResponderMove: (_, gs) => {
                if (gs.dy > 0) {
                    translateY.setValue(gs.dy);
                    // Dim backdrop as user drags down
                    const progress = Math.max(0, 1 - gs.dy / (SCREEN_HEIGHT * 0.4));
                    fadeAnim.setValue(progress);
                }
            },
            onPanResponderRelease: (_, gs) => {
                if (gs.dy > DISMISS_THRESHOLD || gs.vy > VELOCITY_THRESHOLD) {
                    // User swiped far enough or fast enough → close
                    animateOutRef.current();
                } else {
                    // Snap back to open position
                    Animated.parallel([
                        Animated.spring(translateY, {
                            toValue: 0,
                            bounciness: 4,
                            useNativeDriver: true,
                        }),
                        Animated.timing(fadeAnim, {
                            toValue: 1,
                            duration: 150,
                            useNativeDriver: true,
                        }),
                    ]).start();
                }
            },
        })
    ).current;

    if (!showModal) return null;

    return (
        <Modal
            visible
            transparent
            animationType="none"
            hardwareAccelerated
            onShow={animateIn}
            onRequestClose={() => animateOutRef.current()}
        >
            <View style={styles.container}>
                {/* Dim backdrop */}
                <TouchableWithoutFeedback onPress={() => animateOutRef.current()}>
                    <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
                </TouchableWithoutFeedback>

                {/* Bottom sheet card */}
                <Animated.View
                    style={[
                        styles.sheet,
                        { transform: [{ translateY }] },
                    ]}
                >
                    {/* Swipe handle */}
                    <View style={styles.handleContainer} {...panResponder.panHandlers}>
                        <View style={styles.handle} />
                    </View>

                    {/* Children content */}
                    <View style={styles.content}>
                        {children}
                    </View>
                </Animated.View>
            </View>
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
        marginHorizontal: 12,
        marginBottom: Platform.OS === 'ios' ? 32 : 20,
        backgroundColor: COLORS.background,
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
        paddingTop: 14,
        paddingBottom: 10,
    },
    handle: {
        width: 40,
        height: 5,
        borderRadius: 3,
        backgroundColor: COLORS.border || '#D1D1D6',
    },
    content: {
        flexGrow: 1,
        flexShrink: 1,
        overflow: 'hidden',
    },
});
