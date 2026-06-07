import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { checkResetCode, forgotPassword } from '../../store/auth';
import AuthScreenWrapper from '../../components/auth/AuthScreenWrapper';
import AuthHeader from '../../components/auth/AuthHeader';
import AuthInput from '../../components/auth/AuthInput';
import AuthError from '../../components/auth/AuthError';
import AuthSubmitButton from '../../components/auth/AuthSubmitButton';
import AuthFooter from '../../components/auth/AuthFooter';
import createStyles from '../../assets/styles/auth.styles';
import { COLORS } from '../../constants/theme';

export default function ForgotPasswordScreen() {
    const router = useRouter();
    const styles = createStyles(COLORS);

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
        <AuthScreenWrapper>
            <AuthHeader 
                title="Şifre Sıfırlama" 
                subtitle={codeSent ? 'E-postanıza gelen 8 haneli kodu girin.' : 'E-posta adresinizi girin, şifre sıfırlama kodunu gönderelim.'} 
            />

            <View style={styles.card}>
                <View style={styles.inputRow}>
                    <AuthInput
                        label="E-posta Adresi"
                        icon="mail-outline"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        editable={!codeSent}
                        containerStyle={styles.inputRowInput}
                    />
                    <AuthSubmitButton 
                        title="" 
                        icon={codeSent ? 'checkmark' : 'send-outline'}
                        onPress={handleSendCode} 
                        loading={sendLoading}
                        style={[styles.sendButton, codeSent && styles.sendButtonSent, { alignSelf: 'flex-end', marginTop: 18 }]}
                    />
                </View>

                {codeSent && (
                    <>
                        <AuthInput
                            label="Sıfırlama Kodu"
                            icon="key-outline"
                            value={code}
                            onChangeText={(t) => setCode(t.toUpperCase())}
                            autoCapitalize="characters"
                            maxLength={8}
                        />

                        <AuthSubmitButton title="Kodu Doğrula" onPress={handleVerifyCode} loading={verifyLoading} />
                    </>
                )}

                <AuthError error={error} />
            </View>

            <AuthFooter 
                text="Geri Dön" 
                linkText="" 
                onPress={() => router.back()} 
                isBack
            />
        </AuthScreenWrapper>
    );
}
