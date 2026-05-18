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
import styles from '../../assets/styles/auth.styles';
import { COLORS } from '../../constants/theme';
import { checkResetCode, forgotPassword } from '../../store/auth';

export default function ForgotPasswordScreen() {
    const router = useRouter();

    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [codeSent, setCodeSent] = useState(false);
    const [sendLoading, setSendLoading] = useState(false);
    const [verifyLoading, setVerifyLoading] = useState(false);
    const [error, setError] = useState('');

    async function handleSendCode() {
        if (!email.trim())
            return setError('E-posta adresi gerekli.');
        setError('');
        setSendLoading(true);
        try {
            await forgotPassword(email.trim());
            setCodeSent(true);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setSendLoading(false);
        }
    }

    async function handleVerifyCode() {
        if (!code.trim())
            return setError('Sıfırlama kodunu girin.');
        setError('');
        setVerifyLoading(true);
        try {
            const data = await checkResetCode(email.trim(), code.trim());
            router.push({
                pathname: '/(auth)/reset-password',
                params: { temporary_token: data.temporary_token },
            });
        } catch (e: any) {
            setError(e.message);
        } finally {
            setVerifyLoading(false);
        }
    }

    return (
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
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
                        <Text style={styles.title}>Şifre Sıfırlama</Text>
                        <Text style={styles.subtitle}>
                            {codeSent
                                ? 'E-postanıza gelen 8 haneli kodu girin.'
                                : 'E-posta adresinizi girin, şifre sıfırlama kodunu gönderelim.'}
                        </Text>
                    </View>

                    {/* FORM CARD */}
                    <View style={styles.card}>
                        {/* EMAIL ROW */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>E-posta Adresi</Text>
                            <View style={styles.inputRow}>
                                <View style={[styles.inputContainer, styles.inputRowInput]}>
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
                                        editable={!codeSent}
                                        underlineColorAndroid="transparent"
                                    />
                                </View>
                                <TouchableOpacity
                                    style={[styles.sendButton, codeSent && styles.sendButtonSent]}
                                    onPress={handleSendCode}
                                    disabled={codeSent || sendLoading}
                                >
                                    {sendLoading ? (
                                        <ActivityIndicator size="small" color={COLORS.white} />
                                    ) : (
                                        <Ionicons
                                            name={codeSent ? 'checkmark' : 'send-outline'}
                                            size={20}
                                            color={COLORS.white}
                                        />
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* CODE INPUT — visible after code is sent */}
                        {codeSent && (
                            <>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Sıfırlama Kodu</Text>
                                    <View style={styles.inputContainer}>
                                        <Ionicons
                                            name="key-outline"
                                            size={20}
                                            color={COLORS.placeholderText}
                                            style={styles.inputIcon}
                                        />
                                        <TextInput
                                            style={styles.input}
                                            value={code}
                                            onChangeText={(t) => setCode(t.toUpperCase())}
                                            keyboardType="default"
                                            autoCapitalize="characters"
                                            maxLength={8}
                                            underlineColorAndroid="transparent"
                                        />
                                    </View>
                                </View>

                                {/* SUBMIT BUTTON */}
                                <TouchableOpacity
                                    style={[styles.submitButton, verifyLoading && styles.submitButtonDisabled]}
                                    onPress={handleVerifyCode}
                                    disabled={verifyLoading}
                                >
                                    {verifyLoading ? (
                                        <ActivityIndicator size="small" color={COLORS.white} />
                                    ) : (
                                        <>
                                            <Text style={styles.submitButtonText}>Kodu Doğrula</Text>
                                            <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
                                        </>
                                    )}
                                </TouchableOpacity>
                            </>
                        )}

                        {/* ERROR */}
                        {error ? (
                            <View style={styles.errorBox}>
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        ) : null}
                    </View>

                    {/* FOOTER */}
                    <TouchableOpacity style={styles.footer} onPress={() => router.back()}>
                        <Ionicons name="arrow-back-outline" size={16} color={COLORS.textSecondary} />
                        <Text style={styles.footerText}>Geri Dön</Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
