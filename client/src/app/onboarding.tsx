import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import {
    Animated,
    Image,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import createStyles, { SCREEN_WIDTH } from '../assets/styles/onboarding.styles';
import { COLORS } from '../constants/theme';
import { completeOnboarding } from '../store/onboarding';

const SLIDES = [
    {
        icon: null,
        useAccentCircle: false,
        title: "Mind Wallet'e",
        titleAccent: 'Hoş Geldiniz',
        description:
            'Yapay zeka destekli finansal asistanınız ile harcamalarınızı analiz edin, birikim hedeflerinize ulaşın ve akıllı finansal kararlar alın.',
        features: [
            { icon: 'shield-checkmark-outline', text: 'Güvenli' },
            { icon: 'flash-outline', text: 'Akıllı' },
            { icon: 'trending-up-outline', text: 'Etkili' },
        ],
        showLogo: true,
    },
    {
        icon: 'grid-outline' as const,
        useAccentCircle: false,
        title: 'Ana Sayfa',
        titleAccent: 'Her Şey Bir Bakışta',
        description:
            'Bakiyenizi, aylık harcama dağılımınızı, aktif hedeflerinizi ve son işlemlerinizi tek bir ekranda görün. Hızlı gelir/gider ekleme butonları ile anında işlem yapın.',
        features: [
            { icon: 'pie-chart-outline', text: 'Harcama Grafiği' },
            { icon: 'flag-outline', text: 'Hedef Takibi' },
            { icon: 'swap-horizontal-outline', text: 'Hızlı İşlem' },
        ],
        showLogo: false,
    },
    {
        icon: 'sparkles-outline' as const,
        useAccentCircle: true,
        title: 'Mindy',
        titleAccent: 'Finansal Yapay Zekanız',
        description:
            'Mindy, harcamalarınızı analiz eder, dürtüsel alışverişlere karşı sizi uyarır ve tasarruf fırsatlarını otomatik olarak hedeflerinize yönlendirir. Sadece yazın, gerisini Mindy halleder.',
        features: [
            { icon: 'analytics-outline', text: 'Analiz Ajanı' },
            { icon: 'hand-left-outline', text: 'Fren Ajanı' },
            { icon: 'rocket-outline', text: 'Hedef Ajanı' },
        ],
        showLogo: false,
    },
    {
        icon: 'flag-outline' as const,
        useAccentCircle: false,
        title: 'Hedefler &',
        titleAccent: 'İşlem Yönetimi',
        sameColor: true,
        description:
            'Birikim hedefleri oluşturun, ilerlemenizi takip edin ve tüm gelir-gider hareketlerinizi kategorize ederek yönetin. Mindy, algıladığı tasarruf fırsatlarını otomatik olarak hedeflerinize yönlendirir.',
        features: [
            { icon: 'trophy-outline', text: 'Hedef Takibi' },
            { icon: 'list-outline', text: 'İşlem Geçmişi' },
            { icon: 'bookmark-outline', text: 'Pledge Sistemi' },
        ],
        showLogo: false,
    },
];

export default function OnboardingScreen() {
    const styles = createStyles(COLORS);
    const scrollRef = useRef<ScrollView>(null);
    const scrollX = useRef(new Animated.Value(0)).current;
    const [currentIndex, setCurrentIndex] = useState(0);

    function handleNext() {
        if (currentIndex < SLIDES.length - 1) {
            scrollRef.current?.scrollTo({
                x: (currentIndex + 1) * SCREEN_WIDTH,
                animated: true,
            });
            setCurrentIndex(currentIndex + 1);
        } else {
            completeOnboarding();
        }
    }

    function handleSkip() {
        completeOnboarding();
    }

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            {/* SLIDES */}
            <Animated.ScrollView
                ref={scrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                scrollEventThrottle={16}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                    { useNativeDriver: false },
                )}
                onMomentumScrollEnd={(e) => {
                    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                    setCurrentIndex(idx);
                }}
            >
                {SLIDES.map((slide, index) => (
                    <View key={index} style={styles.slide}>
                        {/* LOGO ON FIRST SLIDE */}
                        {slide.showLogo && (
                            <View style={styles.logoRow}>
                                <Image
                                    source={require('../../assets/images/mind_wallet_logo_black.png')}
                                    style={{ width: 128, height: 128 }}
                                    resizeMode="contain"
                                />
                            </View>
                        )}

                        {/* ICON (skip for logo slides) */}
                        {slide.icon && (
                            <View
                                style={[
                                    styles.iconCircle,
                                    slide.useAccentCircle && styles.iconCircleAccent,
                                ]}
                            >
                                <Ionicons
                                    name={slide.icon}
                                    size={52}
                                    color={COLORS.primary}
                                />
                            </View>
                        )}

                        {/* TITLE */}
                        <Text style={styles.slideTitle}>{slide.title}</Text>
                        <Text style={[styles.slideTitleAccent, ('sameColor' in slide && slide.sameColor) && { color: COLORS.textPrimary }]}>{slide.titleAccent}</Text>

                        {/* DESCRIPTION */}
                        <Text style={styles.slideDescription}>{slide.description}</Text>

                        {/* FEATURE CHIPS */}
                        <View style={styles.featureRow}>
                            {slide.features.map((f) => (
                                <View key={f.text} style={styles.featureChip}>
                                    <Ionicons
                                        name={f.icon as any}
                                        size={16}
                                        color={COLORS.primary}
                                    />
                                    <Text style={styles.featureChipText}>{f.text}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                ))}
            </Animated.ScrollView>

            {/* BOTTOM BAR */}
            <View style={styles.bottomBar}>
                {/* DOTS */}
                <View style={styles.dotsRow}>
                    {SLIDES.map((_, i) => {
                        const inputRange = [
                            (i - 1) * SCREEN_WIDTH,
                            i * SCREEN_WIDTH,
                            (i + 1) * SCREEN_WIDTH,
                        ];
                        const dotWidth = scrollX.interpolate({
                            inputRange,
                            outputRange: [6, 24, 6],
                            extrapolate: 'clamp',
                        });
                        const dotOpacity = scrollX.interpolate({
                            inputRange,
                            outputRange: [0.25, 1, 0.25],
                            extrapolate: 'clamp',
                        });
                        return (
                            <Animated.View
                                key={i}
                                style={[
                                    styles.dot,
                                    { width: dotWidth, opacity: dotOpacity },
                                ]}
                            />
                        );
                    })}
                </View>

                {/* NEXT / START BUTTON */}
                <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                    <Text style={styles.nextButtonText}>
                        {currentIndex === SLIDES.length - 1 ? 'Başlayalım' : 'Devam Et'}
                    </Text>
                    <Ionicons
                        name={
                            currentIndex === SLIDES.length - 1
                                ? 'checkmark'
                                : 'arrow-forward'
                        }
                        size={20}
                        color={COLORS.white}
                    />
                </TouchableOpacity>

                {/* SKIP */}
                {currentIndex < SLIDES.length - 1 && (
                    <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                        <Text style={styles.skipButtonText}>Atla</Text>
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
}
