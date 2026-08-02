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
        icon: 'analytics-outline' as const,
        useAccentCircle: false,
        title: 'Akıllı',
        titleAccent: 'Analiz Ajanı',
        description:
            'Mindy, tüm işlemlerinizi anında inceler, otomatik olarak kategorize eder ve size en doğru harcama özetini sunar. Böylece paranızın nereye gittiğini her zaman bilirsiniz.',
        features: [
            { icon: 'pie-chart-outline', text: 'Otomatik Kategori' },
            { icon: 'bar-chart-outline', text: 'Aylık Özet' },
            { icon: 'eye-outline', text: 'Anlık Takip' },
        ],
        showLogo: false,
    },
    {
        icon: 'hand-left-outline' as const,
        useAccentCircle: true,
        title: 'Dürtüsel',
        titleAccent: 'Harcama Koruması',
        description:
            'Gereksiz bir harcama mı yapmak üzeresiniz? Fren Ajanı devreye girer ve sizi uyarır. Size sadece bir saniye durup düşünme fırsatı verir ve tasarruf yapmanızı sağlar.',
        features: [
            { icon: 'stop-circle-outline', text: 'Fren Ajanı' },
            { icon: 'alert-circle-outline', text: 'Akıllı Uyarı' },
            { icon: 'wallet-outline', text: 'Bütçe Koruma' },
        ],
        showLogo: false,
    },
    {
        icon: 'bookmark-outline' as const,
        useAccentCircle: false,
        title: 'Tasarruf',
        titleAccent: 'Taahhütleri',
        sameColor: false,
        description:
            'Fren Ajanı sayesinde bir harcamadan vazgeçtiğinizde, o tutarı bir taahhüt (pledge) olarak kaydedersiniz. Ay sonunda bu tasarruf ettiğiniz para direkt olarak hedefinize eklenir.',
        features: [
            { icon: 'cash-outline', text: 'Taahhüt' },
            { icon: 'time-outline', text: 'Ay Sonu' },
            { icon: 'rocket-outline', text: 'Hedefe Aktarım' },
        ],
        showLogo: false,
    },
    {
        icon: 'flag-outline' as const,
        useAccentCircle: false,
        title: 'Hedefler ve',
        titleAccent: 'Gelecek',
        sameColor: true,
        description:
            'Tatil, araba veya yeni bir bilgisayar... Hedeflerinizi belirleyin ve ilerlemenizi adım adım izleyin. Mindy, hedeflerinize ulaşmanız için sizi motive eder.',
        features: [
            { icon: 'trophy-outline', text: 'Hedef Takibi' },
            { icon: 'trending-up-outline', text: 'İlerleme' },
            { icon: 'heart-outline', text: 'Motivasyon' },
        ],
        showLogo: false,
    },
    {
        icon: 'lock-closed-outline' as const,
        useAccentCircle: true,
        title: 'Güvenlik ve',
        titleAccent: 'Gizlilik',
        sameColor: true,
        description:
            'Finansal verileriniz tamamen size aittir. Mindy verilerinizi sadece size daha iyi bir analiz sunmak için kullanır, asla 3. şahıslarla paylaşmaz.',
        features: [
            { icon: 'shield-half-outline', text: 'Veri Gizliliği' },
            { icon: 'key-outline', text: 'Şifreleme' },
            { icon: 'person-outline', text: 'Kişisel Veri' },
        ],
        showLogo: false,
    },
    {
        icon: 'rocket-outline' as const,
        useAccentCircle: false,
        title: 'Hadi',
        titleAccent: 'Başlayalım',
        description:
            'Artık Mind Wallet ile finansal özgürlüğünüze giden yolda ilk adımı atmaya hazırsınız. Hemen işlemlerinizi eklemeye başlayın ve Mindy ile tanışın!',
        features: [
            { icon: 'add-circle-outline', text: 'İşlem Ekle' },
            { icon: 'chatbubbles-outline', text: 'Mindy ile Konuş' },
            { icon: 'sparkles-outline', text: 'Tasarrufa Başla' },
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
