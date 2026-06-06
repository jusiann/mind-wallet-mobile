import { useRouter } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import { Animated, KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View, Vibration } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { setPin } from '../store/auth';
import { COLORS } from '../constants/theme';
import createStyles from '../assets/styles/pin.styles';

export default function PinSetupScreen() {
    const router = useRouter();
    const styles = createStyles(COLORS);
    
    const [step, setStep] = useState<1 | 2>(1);
    const [firstPin, setFirstPin] = useState('');
    const [secondPin, setSecondPin] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const shakeAnimation = useRef(new Animated.Value(0)).current;

    const currentPin = step === 1 ? firstPin : secondPin;

    useEffect(() => {
        if (currentPin.length === 6) {
            if (step === 1) {
                setTimeout(() => setStep(2), 200);
            } else {
                handleVerifyAndSave();
            }
        }
    }, [currentPin]);

    const triggerShake = () => {
        Vibration.vibrate(100);
        Animated.sequence([
            Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnimation, { toValue: -10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnimation, { toValue: 0, duration: 50, useNativeDriver: true })
        ]).start();
    };

    const handleVerifyAndSave = async () => {
        if (loading) return;
        setLoading(true);
        setError('');

        if (firstPin !== secondPin) {
            triggerShake();
            setError('PIN kodları eşleşmiyor. Lütfen tekrar deneyin.');
            setFirstPin('');
            setSecondPin('');
            setStep(1);
            setLoading(false);
            return;
        }

        try {
            await setPin(firstPin);
            // On success, state updates and RootNavigator redirects to (tabs)
        } catch (err: any) {
            triggerShake();
            setFirstPin('');
            setSecondPin('');
            setStep(1);
            setError(err.message || 'PIN kaydedilirken bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    const handlePress = (num: string) => {
        if (currentPin.length < 6 && !loading) {
            setError('');
            if (step === 1) setFirstPin(prev => prev + num);
            else setSecondPin(prev => prev + num);
        }
    };

    const handleDelete = () => {
        if (currentPin.length > 0 && !loading) {
            setError('');
            if (step === 1) setFirstPin(prev => prev.slice(0, -1));
            else setSecondPin(prev => prev.slice(0, -1));
        } else if (step === 2 && currentPin.length === 0) {
            setStep(1);
        }
    };

    const renderDot = (index: number) => {
        return (
            <View 
                key={index} 
                style={[styles.dot, currentPin.length > index && styles.dotFilled]} 
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
                        <Text style={styles.title}>{step === 1 ? 'PIN Oluştur' : 'PIN Tekrar'}</Text>
                        <Text style={styles.subtitle}>
                            {step === 1 ? 'Uygulama güvenliğin için 6 haneli bir PIN belirle' : 'Oluşturduğun PIN kodunu tekrar gir'}
                        </Text>

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
                                    disabled={loading || (step === 1 && currentPin.length === 0)}
                                >
                                    <Ionicons name="backspace-outline" size={28} color={COLORS.textPrimary} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
