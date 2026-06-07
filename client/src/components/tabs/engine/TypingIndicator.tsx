import React, { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../constants/theme';

interface Props {
    styles: any;
}

export default function TypingIndicator({ styles }: Props) {
    const dot1 = useRef(new Animated.Value(0)).current;
    const dot2 = useRef(new Animated.Value(0)).current;
    const dot3 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const animate = () => {
            const up = { toValue: -5, duration: 250, useNativeDriver: true };
            const down = { toValue: 0, duration: 250, useNativeDriver: true };

            Animated.sequence([
                Animated.timing(dot1, up),
                Animated.timing(dot1, down),
            ]).start();

            setTimeout(() => {
                Animated.sequence([
                    Animated.timing(dot2, up),
                    Animated.timing(dot2, down),
                ]).start();
            }, 150);

            setTimeout(() => {
                Animated.sequence([
                    Animated.timing(dot3, up),
                    Animated.timing(dot3, down),
                ]).start();
            }, 300);
        };

        animate();
        const interval = setInterval(animate, 1000);
        return () => clearInterval(interval);
    }, [dot1, dot2, dot3]);

    return (
        <View style={[styles.msgRow, styles.msgRowMindy]}>
            <View style={styles.mindyAvatar}>
                <Ionicons name="sparkles" size={13} color={COLORS.white} />
            </View>
            <View style={[styles.bubble, styles.bubbleMindy, styles.typingBubble, { flexDirection: 'row', alignItems: 'center', gap: 4, height: 42 }]}>
                <Animated.View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary, transform: [{ translateY: dot1 }] }} />
                <Animated.View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary, transform: [{ translateY: dot2 }] }} />
                <Animated.View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary, transform: [{ translateY: dot3 }] }} />
            </View>
        </View>
    );
}
