import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { login } from '../../store/auth';
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

export default function LoginScreen() {
    const router = useRouter();
    const styles = createStyles(COLORS);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function handleLogin() {
        if (!email.trim() || !password)
            return setError('E-posta ve şifre gerekli.');
        setError('');
        setLoading(true);
        try {
            await login(email.trim(), password);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <AuthScreenWrapper header={<AuthLogo />}>
            <AuthHeader title="Giriş Yap" subtitle="Hesabınıza giriş yapın." />

            <View style={styles.card}>
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
                    rightLink={{ text: 'Şifremi Unuttum?', onPress: () => router.push('/(auth)/forgot-password') }}
                />

                <AuthError error={error} />

                <AuthSubmitButton title="Giriş Yap" onPress={handleLogin} loading={loading} />
            </View>

            <AuthFooter 
                text="Hesabınız yok mu?" 
                linkText="Hesap Oluştur" 
                onPress={() => router.replace('/(auth)/register')} 
            />
        </AuthScreenWrapper>
    );
}
