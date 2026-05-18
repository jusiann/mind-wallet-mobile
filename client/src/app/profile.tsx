import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { changePassword, deleteAccount, getMe, logout, updateProfile } from '../store/auth';
import { COLORS, TYPOGRAPHY } from '../constants/theme';

export default function ProfileScreen() {
    const router = useRouter();
    const [user, setUser] = useState<{ name: string; email: string } | null>(null);

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

    const [logoutLoading, setLogoutLoading] = useState(false);

    const [showDeleteSection, setShowDeleteSection] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [showDeletePwd, setShowDeletePwd] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState('');

    useEffect(() => {
        getMe().then(res => {
            setUser(res);
            setName(res.name);
        }).catch(() => {});
    }, []);

    async function handleUpdateProfile() {
        if (!name.trim()) return;
        setProfileLoading(true);
        setProfileMsg('');
        try {
            const res = await updateProfile({ name: name.trim() });
            setUser(prev => prev ? { ...prev, name: res.name } : null);
            setName(res.name);
            setProfileMsg('success:Profil güncellendi');
        } catch (e: any) {
            setProfileMsg('error:' + e.message);
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
        } catch (e: any) {
            setPwdMsg('error:' + e.message);
        } finally {
            setPwdLoading(false);
        }
    }

    async function handleDeleteAccount() {
        if (!deletePassword.trim()) {
            setDeleteError('Şifrenizi girin.');
            return;
        }
        Alert.alert(
            'Hesabı Sil',
            'Tüm verileriniz kalıcı olarak silinecek. Emin misiniz?',
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Sil', style: 'destructive',
                    onPress: async () => {
                        setDeleteLoading(true);
                        setDeleteError('');
                        try {
                            await deleteAccount({ password: deletePassword });
                        } catch (e: any) {
                            setDeleteError(e.message || 'Hesap silinemedi.');
                        } finally {
                            setDeleteLoading(false);
                        }
                    },
                },
            ],
        );
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

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Profil</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                <ScrollView
                    contentContainerStyle={styles.scroll}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Avatar */}
                    <View style={styles.avatarSection}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{initials}</Text>
                        </View>
                        <Text style={styles.userName}>{user?.name ?? '...'}</Text>
                        <Text style={styles.userEmail}>{user?.email ?? '...'}</Text>
                    </View>

                    {/* Profile Info */}
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Profil Bilgileri</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Ad Soyad</Text>
                            <TextInput
                                style={styles.input}
                                value={name}
                                onChangeText={setName}
                                placeholder="Ad Soyad"
                                placeholderTextColor={COLORS.placeholderText}
                                autoCapitalize="words"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>E-posta</Text>
                            <TextInput
                                style={[styles.input, styles.inputDisabled]}
                                value={user?.email ?? ''}
                                editable={false}
                            />
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

                    {/* Change Password */}
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Şifre Değiştir</Text>

                        {pwdFields.map(({ label, placeholder, value, set, show, toggle }) => (
                            <View key={label} style={styles.inputGroup}>
                                <Text style={styles.label}>{label}</Text>
                                <View style={styles.inputRow}>
                                    <TextInput
                                        style={[styles.input, styles.inputInRow]}
                                        value={value}
                                        onChangeText={set}
                                        secureTextEntry={!show}
                                        placeholder={placeholder}
                                        placeholderTextColor={COLORS.placeholderText}
                                    />
                                    <TouchableOpacity onPress={toggle} style={styles.eyeBtn}>
                                        <Ionicons
                                            name={show ? 'eye-off-outline' : 'eye-outline'}
                                            size={18}
                                            color={COLORS.textSecondary}
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>
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

                    {/* Logout */}
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
                                    <Ionicons name="log-out-outline" size={16} color={COLORS.error} />
                                </>
                            )
                        }
                    </TouchableOpacity>

                    {/* Delete Account */}
                    <TouchableOpacity
                        style={styles.deleteAccountToggle}
                        onPress={() => { setShowDeleteSection(p => !p); setDeleteError(''); setDeletePassword(''); }}
                    >
                        <Text style={styles.deleteAccountToggleText}>Hesabımı Sil</Text>
                        <Ionicons name="trash-outline" size={15} color={COLORS.textSecondary} />
                    </TouchableOpacity>

                    {showDeleteSection && (
                        <View style={styles.deleteSection}>
                            <Text style={styles.deleteSectionHint}>Hesabınızı silmek için şifrenizi girin. Bu işlem geri alınamaz.</Text>
                            <View style={styles.inputRow}>
                                <TextInput
                                    style={[styles.input, styles.inputInRow]}
                                    value={deletePassword}
                                    onChangeText={setDeletePassword}
                                    placeholder="Şifreniz"
                                    placeholderTextColor={COLORS.placeholderText}
                                    secureTextEntry={!showDeletePwd}
                                    autoCapitalize="none"
                                />
                                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowDeletePwd(p => !p)}>
                                    <Ionicons name={showDeletePwd ? 'eye-off-outline' : 'eye-outline'} size={18} color={COLORS.textSecondary} />
                                </TouchableOpacity>
                            </View>
                            {deleteError ? <Text style={[styles.msg, styles.msgError]}>{deleteError}</Text> : null}
                            <TouchableOpacity
                                style={[styles.deleteConfirmBtn, deleteLoading && styles.btnDisabled]}
                                onPress={handleDeleteAccount}
                                disabled={deleteLoading}
                            >
                                {deleteLoading
                                    ? <ActivityIndicator color={COLORS.white} />
                                    : <Text style={styles.deleteConfirmText}>Hesabı Kalıcı Sil</Text>
                                }
                            </TouchableOpacity>
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: COLORS.background },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { ...TYPOGRAPHY.headlineMd, fontSize: 18, color: COLORS.textPrimary },

    scroll: { padding: 20, gap: 16, paddingBottom: 48 },

    avatarSection: { alignItems: 'center', gap: 8, paddingVertical: 8 },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.textPrimary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: { fontFamily: 'HankenGrotesk_700Bold', fontSize: 30, color: COLORS.white },
    userName: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 20, color: COLORS.textPrimary },
    userEmail: { fontFamily: 'HankenGrotesk_400Regular', fontSize: 14, color: COLORS.textSecondary },

    card: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 20,
        gap: 14,
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    cardTitle: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 16, color: COLORS.textPrimary },

    inputGroup: { gap: 6 },
    label: { fontFamily: 'HankenGrotesk_500Medium', fontSize: 13, color: COLORS.textSecondary },
    input: {
        backgroundColor: COLORS.inputBackground,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontFamily: 'HankenGrotesk_400Regular',
        fontSize: 15,
        color: COLORS.textPrimary,
    },
    inputDisabled: { color: COLORS.placeholderText },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.inputBackground,
        borderRadius: 12,
    },
    inputInRow: { flex: 1, backgroundColor: 'transparent' },
    eyeBtn: { paddingHorizontal: 12, paddingVertical: 10 },

    msg: { fontFamily: 'HankenGrotesk_400Regular', fontSize: 13 },
    msgSuccess: { color: '#4CAF50' },
    msgError: { color: COLORS.error },

    btn: {
        backgroundColor: COLORS.textPrimary,
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
    },
    btnDisabled: { opacity: 0.6 },
    btnText: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 15, color: COLORS.white },

    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    logoutText: { fontFamily: 'HankenGrotesk_500Medium', fontSize: 14, color: COLORS.error },

    deleteAccountToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 8,
        alignSelf: 'center',
    },
    deleteAccountToggleText: { fontFamily: 'HankenGrotesk_400Regular', fontSize: 13, color: COLORS.textSecondary },

    deleteSection: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 16,
        gap: 12,
        borderWidth: 1,
        borderColor: COLORS.error,
    },
    deleteSectionHint: { fontFamily: 'HankenGrotesk_400Regular', fontSize: 13, color: COLORS.textSecondary, lineHeight: 20 },
    deleteConfirmBtn: {
        backgroundColor: COLORS.error,
        borderRadius: 12,
        paddingVertical: 13,
        alignItems: 'center',
    },
    deleteConfirmText: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 15, color: COLORS.white },
});
