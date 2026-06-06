import { useRouter } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import { Animated, KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View, Vibration } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { verifyPin, logout } from '../store/auth';
import { COLORS } from '../constants/theme';
import createStyles from '../assets/styles/pin.styles';

export default function PinEntryScreen() {
    const router = useRouter();
    const styles = createStyles(COLORS);
    
    const [pin, setPin] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [attempts, setAttempts] = useState(0);
    const shakeAnimation = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (pin.length === 6) {
            handleVerify();
        }
    }, [pin]);

    const triggerShake = () => {
        Vibration.vibrate(100);
        Animated.sequence([
            Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnimation, { toValue: -10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnimation, { toValue: 0, duration: 50, useNativeDriver: true })
        ]).start();
    };

    const handleVerify = async () => {
        if (loading) return;
        setLoading(true);
        setError('');

        try {
            await verifyPin(pin);
            // On success, state updates and RootNavigator redirects to (tabs)
        } catch (err: any) {
            triggerShake();
            setPin('');
            const newAttempts = attempts + 1;
            setAttempts(newAttempts);
            
            if (newAttempts >= 5) {
                await logout(); // Will redirect to login
            } else {
                setError('Hatalı PIN. Lütfen tekrar deneyin.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handlePress = (num: string) => {
        if (pin.length < 6 && !loading) {
            setError('');
            setPin(prev => prev + num);
        }
    };

    const handleDelete = () => {
        if (pin.length > 0 && !loading) {
            setError('');
            setPin(prev => prev.slice(0, -1));
        }
    };

    const renderDot = (index: number) => {
        return (
            <View 
                key={index} 
                style={[styles.dot, pin.length > index && styles.dotFilled]} 
            />
        );
    };

    const NumButton = ({ num }: { num: string }) => (
        <TouchableOpacity 
            style={styles.numpadBtn} 
            onPress={() => handlePress(num)}
            disabled={loading}
        >
            <Text style={styles.numpadBtnText}>{num}</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView contentContainerStyle={styles.scroll}>

                    <Text style={styles.brandTitle}>Mind Wallet</Text>


                    <Animated.View style={[styles.card, { transform: [{ translateX: shakeAnimation }] }]}>
                        <Text style={styles.title}>Hoş Geldin</Text>
                        <Text style={styles.subtitle}>Devam etmek için PIN kodunu gir</Text>

                        <View style={styles.dotsContainer}>
                            {[0, 1, 2, 3, 4, 5].map(renderDot)}
                        </View>

                        {error ? <Text style={styles.errorText}>{error}</Text> : null}

                        <View style={styles.numpad}>
                            <View style={styles.numpadRow}>
                                <NumButton num="1" />
                                <NumButton num="2" />
                                <NumButton num="3" />
                            </View>
                            <View style={styles.numpadRow}>
                                <NumButton num="4" />
                                <NumButton num="5" />
                                <NumButton num="6" />
                            </View>
                            <View style={styles.numpadRow}>
                                <NumButton num="7" />
                                <NumButton num="8" />
                                <NumButton num="9" />
                            </View>
                            <View style={styles.numpadRow}>
                                <View style={[styles.numpadBtn, styles.numpadBtnEmpty]} />
                                <NumButton num="0" />
                                <TouchableOpacity 
                                    style={[styles.numpadBtn, styles.numpadBtnEmpty]} 
                                    onPress={handleDelete}
                                    disabled={loading || pin.length === 0}
                                >
                                    <Ionicons name="backspace-outline" size={28} color={COLORS.textPrimary} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
                            <Text style={styles.logoutText}>Başka bir hesapla giriş yap</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
