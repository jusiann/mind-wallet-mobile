import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { resetPassword } from '../../store/auth';
import styles from '../../assets/styles/auth.styles';
import { COLORS } from '../../constants/theme';

export default function ResetPasswordScreen() {
    const router = useRouter();
    const { temporary_token } = useLocalSearchParams<{ temporary_token: string }>();

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function handleReset() {
        if (!newPassword || !confirmPassword)
            return setError('Tüm alanları doldurun.');
        if (newPassword !== confirmPassword)
            return setError('Şifreler eşleşmiyor.');
        setError('');
        setLoading(true);
        try {
            await resetPassword(newPassword, temporary_token!);
            Alert.alert('Başarılı', 'Şifreniz başarıyla değiştirildi.', [
                { text: 'Giriş Yap', onPress: () => router.replace('/(auth)/login') },
            ]);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
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
                        <Text style={styles.title}>Yeni Şifre</Text>
                        <Text style={styles.subtitle}>Yeni şifrenizi belirleyin.</Text>
                    </View>

                    {/* FORM CARD */}
                    <View style={styles.card}>
                        {/* NEW PASSWORD */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Yeni Şifre</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons
                                    name="lock-closed-outline"
                                    size={20}
                                    color={COLORS.placeholderText}
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    style={styles.input}
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                    secureTextEntry={!showNewPassword}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    underlineColorAndroid="transparent"
                                />
                                <TouchableOpacity
                                    style={styles.eyeButton}
                                    onPress={() => setShowNewPassword(!showNewPassword)}
                                >
                                    <Ionicons
                                        name={showNewPassword ? 'eye-outline' : 'eye-off-outline'}
                                        size={20}
                                        color={COLORS.placeholderText}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* CONFIRM PASSWORD */}
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

                        {/* SUBMIT */}
                        <TouchableOpacity
                            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                            onPress={handleReset}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color={COLORS.white} />
                            ) : (
                                <>
                                    <Text style={styles.submitButtonText}>Şifreyi Sıfırla</Text>
                                    <Ionicons name="checkmark-outline" size={18} color={COLORS.white} />
                                </>
                            )}
                        </TouchableOpacity>
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
