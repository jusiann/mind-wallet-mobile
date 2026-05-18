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
import { changePassword, deleteAccount, getMe, logout, updateProfile } from '../../store/auth';
import styles from '../../assets/styles/profile.styles';
import { COLORS } from '../../constants/theme';
import { useAlert } from '../../constants/alert';

export default function ProfileScreen() {
    const router = useRouter();
    const { showAlert, alertEl } = useAlert();

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
        showAlert({
            title: 'Hesabı Sil',
            message: 'Tüm verileriniz kalıcı olarak silinecek. Emin misiniz?',
            confirm: {
                label: 'Sil',
                destructive: true,
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
        });
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
                    <Ionicons name='arrow-back' size={22} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Profil</Text>
                <View style={styles.spacer} />
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.kbdAvoid}>
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
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Ad Soyad</Text>
                            <TextInput
                                style={styles.input}
                                value={name}
                                onChangeText={setName}
                                placeholder='Ad Soyad'
                                placeholderTextColor={COLORS.placeholderText}
                                autoCapitalize='words'
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

                    {/* CHANGE PASSWORD */}
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

                    {/* LOGOUT */}
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
                                    <Ionicons name='log-out-outline' size={16} color={COLORS.error} />
                                </>
                            )
                        }
                    </TouchableOpacity>

                    {/* DELETE ACCOUNT */}
                    <TouchableOpacity
                        style={styles.deleteAccountToggle}
                        onPress={() => { setShowDeleteSection(p => !p); setDeleteError(''); setDeletePassword(''); }}
                    >
                        <Text style={styles.deleteAccountToggleText}>Hesabımı Sil</Text>
                        <Ionicons name='trash-outline' size={15} color={COLORS.textSecondary} />
                    </TouchableOpacity>

                    {showDeleteSection && (
                        <View style={styles.deleteSection}>
                            <Text style={styles.deleteSectionHint}>
                                Hesabınızı silmek için şifrenizi girin. Bu işlem geri alınamaz.
                            </Text>
                            <View style={styles.inputRow}>
                                <TextInput
                                    style={[styles.input, styles.inputInRow]}
                                    value={deletePassword}
                                    onChangeText={setDeletePassword}
                                    placeholder='Şifreniz'
                                    placeholderTextColor={COLORS.placeholderText}
                                    secureTextEntry={!showDeletePwd}
                                    autoCapitalize='none'
                                />
                                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowDeletePwd(p => !p)}>
                                    <Ionicons
                                        name={showDeletePwd ? 'eye-off-outline' : 'eye-outline'}
                                        size={18}
                                        color={COLORS.textSecondary}
                                    />
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
            {alertEl}
        </SafeAreaView>
    );
}
