import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { register } from '../../store/auth';
import AuthScreenWrapper from '../../components/auth/AuthScreenWrapper';
import AuthLogo from '../../components/auth/AuthLogo';
import AuthHeader from '../../components/auth/AuthHeader';
import AuthInput from '../../components/auth/AuthInput';
import AuthPasswordInput from '../../components/auth/AuthPasswordInput';
import AuthError from '../../components/auth/AuthError';
import AuthSubmitButton from '../../components/auth/AuthSubmitButton';
import AuthFooter from '../../components/auth/AuthFooter';
import createStyles from '../../assets/styles/auth.styles';
import { COLORS } from '../../constants/theme';

export default function RegisterScreen() {
    const router = useRouter();
    const styles = createStyles(COLORS);
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
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
            await register(fullName.trim(), email.trim(), password);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <AuthScreenWrapper header={<AuthLogo />}>
            <AuthHeader title="Hesap Oluştur" subtitle="İkinci finansal beyninize katılın." />

            <View style={styles.card}>
                <AuthInput
                    label="Ad Soyad"
                    icon="person-outline"
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                />

                <AuthInput
                    label="E-posta Adresi"
                    icon="mail-outline"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                />

                <AuthPasswordInput
                    label="Şifre"
                    value={password}
                    onChangeText={setPassword}
                />

                <AuthPasswordInput
                    label="Şifreyi Onayla"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                />

                <AuthError error={error} />

                <AuthSubmitButton title="Kayıt Ol" onPress={handleRegister} loading={loading} />
            </View>

            <AuthFooter 
                text="Zaten hesabınız var mı?" 
                linkText="Giriş Yap" 
                onPress={() => router.replace('/(auth)/login')} 
            />
        </AuthScreenWrapper>
    );
}
