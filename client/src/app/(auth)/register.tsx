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
import { signup } from '../../api/auth';
import styles from '../../assets/styles/auth.styles';
import { COLORS } from '../../constants/theme';
import { saveTokens, setAuthState, setUserName } from '../../store/auth';

export default function RegisterScreen() {
    const router = useRouter();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function handleRegister() {
        if (!fullName.trim() || !email.trim() || !password || !confirmPassword)
            return setError('Tüm alanları doldurun.');

        if (password !== confirmPassword)
            return setError('Şifreler eşleşmiyor.');
        
        setError('');
        setLoading(true);
        try {
            const data = await signup({ fullname: fullName.trim(), email: email.trim(), password });
            await saveTokens(data.access_token, data.refresh_token);
            setUserName(data.user.name);
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
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={styles.scroll}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* HEADER */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Hesap Oluştur</Text>
                        <Text style={styles.subtitle}>İkinci finansal beyninize katılın.</Text>
                    </View>

                    {/* FORM CARD */}
                    <View style={styles.card}>
                        {/* FULL NAME INPUT */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Ad Soyad</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons
                                    name="person-outline"
                                    size={20}
                                    color={COLORS.placeholderText}
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    style={styles.input}
                                    value={fullName}
                                    onChangeText={setFullName}
                                    autoCapitalize="words"
                                    underlineColorAndroid="transparent"
                                />
                            </View>
                        </View>

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
                            <Text style={styles.inputLabel}>Şifre</Text>
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

                        {/* CONFIRM PASSWORD INPUT */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Şifreyi Onayla</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons
                                    name="lock-closed-outline"
                                    size={20}
                                    color={COLORS.placeholderText}
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    style={styles.input}
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry={!showConfirmPassword}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    underlineColorAndroid="transparent"
                                />
                                <TouchableOpacity
                                    style={styles.eyeButton}
                                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    <Ionicons
                                        name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
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
                            onPress={handleRegister}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color={COLORS.white} />
                            ) : (
                                <>
                                    <Text style={styles.submitButtonText}>Kayıt Ol</Text>
                                    <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
                                </>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* FOOTER */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Zaten hesabınız var mı?</Text>
                        <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
                            <Text style={styles.footerLink}>Giriş Yap</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
