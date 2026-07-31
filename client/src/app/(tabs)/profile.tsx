import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
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
import { changePassword, deleteAccount, getMe, logout, updateProfile, changePin } from '../../store/auth';
import createStyles from '../../assets/styles/profile.styles';
import { COLORS } from '../../constants/theme';
import { useAlert } from '../../constants/alert';
import { CURRENCIES, CurrencyCode } from '../../constants/currency';
import { useCurrency } from '../../hooks/useCurrency';
import { Modal } from 'react-native';
import ProfileInputGroup from '../../components/tabs/profile/ProfileInputGroup';
import ProfilePasswordInput from '../../components/tabs/profile/ProfilePasswordInput';
import QuickActionCard from '../../components/tabs/QuickActionCard';
import BottomSheetModal from '../../components/BottomSheetModal';
import BottomSheetHeader from '../../components/tabs/BottomSheetHeader';

export default function ProfileScreen() {
    const router = useRouter();
    const styles = createStyles(COLORS);
    const { showAlert, alertEl } = useAlert();
    const { currency: currentCurrency } = useCurrency();

    const [user, setUser] = useState<{ name: string; email: string } | null>(null);
    const [showCurrencyModal, setShowCurrencyModal] = useState(false);

    const [name, setName] = useState('');
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileMsg, setProfileMsg] = useState('');

    const [currentPwd, setCurrentPwd] = useState('');
    const [newPwd, setNewPwd] = useState('');
    const [confirmPwd, setConfirmPwd] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [pwdLoading, setPwdLoading] = useState(false);
    const [pwdMsg, setPwdMsg] = useState('');
    const [showPwdModal, setShowPwdModal] = useState(false);

    const [logoutLoading, setLogoutLoading] = useState(false);

    const [currentPin, setCurrentPin] = useState('');
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [showCurrentPin, setShowCurrentPin] = useState(false);
    const [showNewPin, setShowNewPin] = useState(false);
    const [showConfirmPin, setShowConfirmPin] = useState(false);
    const [pinLoading, setPinLoading] = useState(false);
    const [pinMsg, setPinMsg] = useState('');
    const [showPinModal, setShowPinModal] = useState(false);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState('');

    useEffect(() => {
        getMe().then(res => {
            setUser(res);
            setName(res.name);
        }).catch(() => { });
    }, []);

    async function handleUpdateProfile() {
        if (!name.trim()) return;
        setProfileLoading(true);
        setProfileMsg('');
        try {
            const res = await updateProfile({ name: name.trim() });
            setUser(prev => prev ? { ...prev, name: res.name } : null);
            setName(res.name);
            setProfileMsg('success:Profil Güncellendi');
            setTimeout(() => setProfileMsg(''), 1500);
        } catch (e: any) {
            setProfileMsg('error:' + e.message);
            setTimeout(() => setProfileMsg(''), 1500);
        } finally {
            setProfileLoading(false);
        }
    }

    async function handleCurrencySelect(code: CurrencyCode) {
        setShowCurrencyModal(false);
        if (code === currentCurrency) return;
        setProfileLoading(true);
        setProfileMsg('');
        try {
            await updateProfile({ currency: code });
            setProfileMsg('success:Para Birimi Güncellendi');
            setTimeout(() => setProfileMsg(''), 1500);
        } catch (e: any) {
            setProfileMsg('error:' + e.message);
            setTimeout(() => setProfileMsg(''), 1500);
        } finally {
            setProfileLoading(false);
        }
    }

    async function handleChangePassword() {
        if (!currentPwd || !newPwd || !confirmPwd) {
            setPwdMsg('error:Tüm alanları doldurun.');
            return;
        }
        if (newPwd !== confirmPwd) {
            setPwdMsg('error:Yeni şifreler eşleşmiyor.');
            return;
        }
        setPwdLoading(true);
        setPwdMsg('');
        try {
            await changePassword({ current_password: currentPwd, new_password: newPwd });
            setCurrentPwd('');
            setNewPwd('');
            setConfirmPwd('');
            setPwdMsg('success:Şifre değiştirildi');
            setTimeout(() => {
                setShowPwdModal(false);
                setPwdMsg('');
            }, 1500);
        } catch (e: any) {
            setPwdMsg('error:' + e.message);
        } finally {
            setPwdLoading(false);
        }
    }

    async function handleChangePin() {
        if (!currentPin || !newPin || !confirmPin) {
            setPinMsg('error:Tüm alanları doldurun.');
            return;
        }
        if (newPin !== confirmPin) {
            setPinMsg('error:Yeni PIN kodları eşleşmiyor.');
            return;
        }
        if (newPin.length !== 6 || currentPin.length !== 6) {
            setPinMsg('error:PIN 6 haneli olmalıdır.');
            return;
        }
        setPinLoading(true);
        setPinMsg('');
        try {
            await changePin(currentPin, newPin);
            setCurrentPin('');
            setNewPin('');
            setConfirmPin('');
            setPinMsg('success:PIN değiştirildi');
            setTimeout(() => {
                setShowPinModal(false);
                setPinMsg('');
            }, 1500);
        } catch (e: any) {
            setPinMsg('error:' + e.message);
        } finally {
            setPinLoading(false);
        }
    }

    const isDeleteConfirmed = deleteConfirmText.trim().toUpperCase().replace(/İ/g, 'I') === 'ONAYLIYORUM';

    async function handleDeleteAccount() {
        if (!isDeleteConfirmed) {
            setDeleteError("Lütfen onaylamak için 'ONAYLIYORUM' yazın.");
            return;
        }
        setDeleteLoading(true);
        setDeleteError('');
        try {
            await deleteAccount();
        } catch (e: any) {
            setDeleteError(e.message || 'Hesap silinemedi.');
        } finally {
            setDeleteLoading(false);
        }
    }

    async function handleLogout() {
        setLogoutLoading(true);
        await logout();
    }

    const initials = user?.name
        .split(' ')
        .map(w => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) ?? '?';

    const pwdFields = [
        { label: 'Mevcut Şifre', placeholder: '••••••••', value: currentPwd, set: setCurrentPwd, show: showCurrent, toggle: () => setShowCurrent(p => !p) },
        { label: 'Yeni Şifre', placeholder: '', value: newPwd, set: setNewPwd, show: showNew, toggle: () => setShowNew(p => !p) },
        { label: 'Yeni Şifre (Tekrar)', placeholder: '', value: confirmPwd, set: setConfirmPwd, show: showConfirm, toggle: () => setShowConfirm(p => !p) },
    ];

    const pinFields = [
        { label: 'Mevcut PIN', placeholder: '••••••', value: currentPin, set: setCurrentPin, show: showCurrentPin, toggle: () => setShowCurrentPin(p => !p) },
        { label: 'Yeni PIN', placeholder: '', value: newPin, set: setNewPin, show: showNewPin, toggle: () => setShowNewPin(p => !p) },
        { label: 'Yeni PIN (Tekrar)', placeholder: '', value: confirmPin, set: setConfirmPin, show: showConfirmPin, toggle: () => setShowConfirmPin(p => !p) },
    ];

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name='arrow-back' size={28} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Profil</Text>
                <View style={styles.spacer} />
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.kbdAvoid}>
                <ScrollView
                    contentContainerStyle={styles.scroll}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps='handled'
                >
                    {/* AVATAR */}
                    <View style={styles.avatarSection}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{initials}</Text>
                        </View>
                        <Text style={styles.userName}>{user?.name ?? '...'}</Text>
                        <Text style={styles.userEmail}>{user?.email ?? '...'}</Text>
                    </View>

                    {/* PROFILE INFO */}
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Profil Bilgileri</Text>
                        <ProfileInputGroup
                            label="Ad Soyad"
                            value={name}
                            onChangeText={setName}
                            placeholder="Ad Soyad"
                            autoCapitalize="words"
                        />
                        <ProfileInputGroup
                            label="E-posta"
                            value={user?.email ?? ''}
                            editable={false}
                        />
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Para Birimi</Text>
                            <TouchableOpacity
                                style={[styles.input, { justifyContent: 'center' }]}
                                onPress={() => setShowCurrencyModal(true)}
                            >
                                <Text style={{ color: COLORS.textPrimary, fontFamily: 'HankenGrotesk_400Regular', fontSize: 15 }}>
                                    {CURRENCIES[currentCurrency]?.label} ({CURRENCIES[currentCurrency]?.symbol})
                                </Text>
                            </TouchableOpacity>
                        </View>
                        {profileMsg ? (
                            <Text style={[styles.msg, profileMsg.startsWith('success') ? styles.msgSuccess : styles.msgError]}>
                                {profileMsg.replace(/^(success|error):/, '')}
                            </Text>
                        ) : null}
                        <TouchableOpacity
                            style={[styles.btn, profileLoading && styles.btnDisabled]}
                            onPress={handleUpdateProfile}
                            disabled={profileLoading}
                        >
                            {profileLoading
                                ? <ActivityIndicator color={COLORS.white} />
                                : <Text style={styles.btnText}>Kaydet</Text>
                            }
                        </TouchableOpacity>
                    </View>

                    {/* QUICK ACTIONS ROW FOR SECURITY */}
                    <View style={styles.quickActionsRow}>
                        <QuickActionCard title="Şifre Değiştir" icon="lock-closed-outline" onPress={() => setShowPwdModal(true)} />
                        <QuickActionCard title="PIN Değiştir" icon="keypad-outline" onPress={() => setShowPinModal(true)} />
                    </View>

                    {/* LOGOUT + DELETE ROW */}
                    <View style={styles.bottomActionsRow}>
                        <TouchableOpacity
                            style={styles.deleteAccountToggle}
                            onPress={() => { setShowDeleteModal(true); setDeleteError(''); setDeleteConfirmText(''); }}
                        >
                            <Text style={styles.deleteAccountToggleText}>Hesabımı Sil</Text>
                            <Ionicons name='trash-outline' size={15} color={COLORS.textSecondary} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.logoutBtn, logoutLoading && styles.btnDisabled]}
                            onPress={handleLogout}
                            disabled={logoutLoading}
                        >
                            {logoutLoading
                                ? <ActivityIndicator color={COLORS.error} />
                                : (
                                    <>
                                        <Text style={styles.logoutText}>Çıkış Yap</Text>
                                        <Ionicons name='log-out-outline' size={15} color={COLORS.error} />
                                    </>
                                )
                            }
                        </TouchableOpacity>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>
            {alertEl}

            {/* CURRENCY BOTTOM SHEET */}
            <BottomSheetModal visible={showCurrencyModal} onClose={() => setShowCurrencyModal(false)}>
                <BottomSheetHeader title="Para Birimi Seçin" />
                <View style={{ padding: 20, gap: 12 }}>
                    {(Object.entries(CURRENCIES) as [CurrencyCode, typeof CURRENCIES[CurrencyCode]][]).map(([code, config]) => (
                        <TouchableOpacity
                            key={code}
                            style={[styles.currencyOption, currentCurrency === code && styles.currencyOptionSelected]}
                            onPress={() => handleCurrencySelect(code)}
                        >
                            <Text style={styles.currencyOptionText}>{config.label}</Text>
                            <Text style={styles.currencyOptionSymbol}>{config.symbol}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </BottomSheetModal>

            {/* PASSWORD BOTTOM SHEET */}
            <BottomSheetModal visible={showPwdModal} onClose={() => setShowPwdModal(false)}>
                <BottomSheetHeader title="Şifre Değiştir" />
                <View style={{ padding: 20, gap: 16 }}>
                    {pwdFields.map(({ label, placeholder, value, set, show, toggle }) => (
                        <ProfilePasswordInput
                            key={label}
                            label={label}
                            placeholder={placeholder}
                            value={value}
                            onChangeText={set}
                            show={show}
                            onToggleShow={toggle}
                        />
                    ))}
                    {pwdMsg ? (
                        <Text style={[styles.msg, pwdMsg.startsWith('success') ? styles.msgSuccess : styles.msgError]}>
                            {pwdMsg.replace(/^(success|error):/, '')}
                        </Text>
                    ) : null}
                    <TouchableOpacity
                        style={[styles.btn, pwdLoading && styles.btnDisabled]}
                        onPress={handleChangePassword}
                        disabled={pwdLoading}
                    >
                        {pwdLoading
                            ? <ActivityIndicator color={COLORS.white} />
                            : <Text style={styles.btnText}>Şifreyi Güncelle</Text>
                        }
                    </TouchableOpacity>
                </View>
            </BottomSheetModal>

            {/* PIN BOTTOM SHEET */}
            <BottomSheetModal visible={showPinModal} onClose={() => setShowPinModal(false)}>
                <BottomSheetHeader title="PIN Değiştir" />
                <View style={{ padding: 20, gap: 16 }}>
                    {pinFields.map(({ label, placeholder, value, set, show, toggle }) => (
                        <ProfilePasswordInput
                            key={label}
                            label={label}
                            placeholder={placeholder}
                            value={value}
                            onChangeText={set}
                            show={show}
                            onToggleShow={toggle}
                            keyboardType="numeric"
                            maxLength={6}
                        />
                    ))}
                    {pinMsg ? (
                        <Text style={[styles.msg, pinMsg.startsWith('success') ? styles.msgSuccess : styles.msgError]}>
                            {pinMsg.replace(/^(success|error):/, '')}
                        </Text>
                    ) : null}
                    <TouchableOpacity
                        style={[styles.btn, pinLoading && styles.btnDisabled]}
                        onPress={handleChangePin}
                        disabled={pinLoading}
                    >
                        {pinLoading
                            ? <ActivityIndicator color={COLORS.white} />
                            : <Text style={styles.btnText}>PIN'i Güncelle</Text>
                        }
                    </TouchableOpacity>
                </View>
            </BottomSheetModal>

            {/* DELETE ACCOUNT BOTTOM SHEET */}
            <BottomSheetModal visible={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
                <BottomSheetHeader title="Hesabımı Sil" />
                <View style={{ padding: 20, gap: 16 }}>
                    <Text style={{ fontFamily: 'HankenGrotesk_400Regular', fontSize: 14, color: COLORS.textSecondary, lineHeight: 20 }}>
                        Hesabınızı ve tüm verilerinizi kalıcı olarak silmek üzeresiniz. Bu işlem geri alınamaz.
                        Onaylamak için aşağıya <Text style={{ fontFamily: 'HankenGrotesk_700Bold', color: COLORS.error }}>ONAYLIYORUM</Text> yazın.
                    </Text>
                    <ProfileInputGroup
                        label="Onay Metni"
                        value={deleteConfirmText}
                        onChangeText={setDeleteConfirmText}
                        placeholder="ONAYLIYORUM"
                        autoCapitalize="characters"
                    />
                    {deleteError ? <Text style={[styles.msg, styles.msgError]}>{deleteError}</Text> : null}
                    <TouchableOpacity
                        style={[styles.deleteConfirmBtn, (deleteLoading || !isDeleteConfirmed) && styles.btnDisabled]}
                        onPress={handleDeleteAccount}
                        disabled={deleteLoading || !isDeleteConfirmed}
                    >
                        {deleteLoading
                            ? <ActivityIndicator color={COLORS.white} />
                            : <Text style={styles.deleteConfirmText}>Hesabı Kalıcı Olarak Sil</Text>
                        }
                    </TouchableOpacity>
                </View>
            </BottomSheetModal>
        </SafeAreaView>
    );
}
