import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signin } from '../../api/auth';
import styles from '../../assets/styles/auth.styles';
import { COLORS } from '../../constants/theme';
import { saveTokens, setAuthState } from '../../store/auth';

export default function LoginScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function handleLogin() {
        if (!email.trim() || !password)
            return setError('E-posta ve şifre gerekli.');
        setError('');
        setLoading(true);
        try {
            const data = await signin({ email: email.trim(), password });
            await saveTokens(data.access_token, data.refresh_token);
            setAuthState(true);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
            {/* LOGO */}
            <View style={styles.logoRow}>
                <Ionicons name="wallet" size={36} color={COLORS.textPrimary} />
                <Text style={styles.logoText}>Mind Wallet</Text>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={styles.scroll}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* HEADER */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Giriş Yap</Text>
                        <Text style={styles.subtitle}>Hesabınıza giriş yapın.</Text>
                    </View>

                    {/* FORM CARD */}
                    <View style={styles.card}>
                        {/* EMAIL INPUT */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>E-posta Adresi</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons
                                    name="mail-outline"
                                    size={20}
                                    color={COLORS.placeholderText}
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    style={styles.input}
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    underlineColorAndroid="transparent"
                                />
                            </View>
                        </View>

                        {/* PASSWORD INPUT */}
                        <View style={styles.inputGroup}>
                            <View style={styles.inputLabelRow}>
                                <Text style={styles.inputLabel}>Şifre</Text>
                                <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
                                    <Text style={styles.forgotPasswordLink}>Şifremi Unuttum?</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.inputContainer}>
                                <Ionicons
                                    name="lock-closed-outline"
                                    size={20}
                                    color={COLORS.placeholderText}
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    style={styles.input}
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    underlineColorAndroid="transparent"
                                />
                                <TouchableOpacity
                                    style={styles.eyeButton}
                                    onPress={() => setShowPassword(!showPassword)}
                                >
                                    <Ionicons
                                        name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                                        size={20}
                                        color={COLORS.placeholderText}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* ERROR */}
                        {error ? (
                            <View style={styles.errorBox}>
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        ) : null}

                        {/* SUBMIT BUTTON */}
                        <TouchableOpacity
                            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                            onPress={handleLogin}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color={COLORS.white} />
                            ) : (
                                <>
                                    <Text style={styles.submitButtonText}>Giriş Yap</Text>
                                    <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
                                </>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* FOOTER */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Hesabınız yok mu?</Text>
                        <TouchableOpacity onPress={() => router.replace('/(auth)/register')}>
                            <Text style={styles.footerLink}>Hesap Oluştur</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
