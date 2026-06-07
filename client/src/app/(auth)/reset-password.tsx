import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { resetPassword } from '../../store/auth';
import { useAlert } from '../../constants/alert';
import AuthScreenWrapper from '../../components/auth/AuthScreenWrapper';
import AuthHeader from '../../components/auth/AuthHeader';
import AuthPasswordInput from '../../components/auth/AuthPasswordInput';
import AuthError from '../../components/auth/AuthError';
import AuthSubmitButton from '../../components/auth/AuthSubmitButton';
import AuthFooter from '../../components/auth/AuthFooter';
import createStyles from '../../assets/styles/auth.styles';
import { COLORS } from '../../constants/theme';

export default function ResetPasswordScreen() {
    const router = useRouter();
    const { temporary_token } = useLocalSearchParams<{ temporary_token: string }>();

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const styles = createStyles(COLORS);
    const { showAlert, alertEl } = useAlert();

    async function handleReset() {
        if (!newPassword || !confirmPassword)
            return setError('Tüm alanları doldurun.');
        if (newPassword !== confirmPassword)
            return setError('Şifreler eşleşmiyor.');
        setError('');
        setLoading(true);
        try {
            await resetPassword(newPassword, temporary_token!);
            showAlert({
                title: 'Başarılı',
                message: 'Şifreniz başarıyla değiştirildi.',
                confirm: {
                    label: 'Giriş Yap',
                    hideCancel: true,
                    onPress: () => router.replace('/(auth)/login'),
                },
            });
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <AuthScreenWrapper>
            <AuthHeader title="Yeni Şifre" subtitle="Yeni şifrenizi belirleyin." />

            <View style={styles.card}>
                <AuthPasswordInput
                    label="Yeni Şifre"
                    value={newPassword}
                    onChangeText={setNewPassword}
                />

                <AuthPasswordInput
                    label="Şifreyi Onayla"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                />

                <AuthError error={error} />

                <AuthSubmitButton 
                    title="Şifreyi Sıfırla" 
                    icon="checkmark-outline"
                    onPress={handleReset} 
                    loading={loading} 
                />
            </View>

            <AuthFooter 
                text="Geri Dön" 
                linkText="" 
                onPress={() => router.back()} 
                isBack
            />

            {alertEl}
        </AuthScreenWrapper>
    );
}
