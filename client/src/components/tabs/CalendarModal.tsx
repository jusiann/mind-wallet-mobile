import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import BottomSheetModal from '../BottomSheetModal';
import BottomSheetHeader from './BottomSheetHeader';
import { COLORS } from '../../constants/theme';

LocaleConfig.locales['tr'] = {
    monthNames: ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'],
    monthNamesShort: ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'],
    dayNames: ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'],
    dayNamesShort: ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'],
    today: 'Bugün'
};
LocaleConfig.defaultLocale = 'tr';

interface Props {
    visible: boolean;
    onClose: () => void;
    date: Date;
    onSelectDate: (date: Date) => void;
    title?: string;
}

export default function CalendarModal({ visible, onClose, date, onSelectDate, title = "Tarih Seç" }: Props) {
    const selectedString = date.toISOString().split('T')[0];

    return (
        <BottomSheetModal visible={visible} onClose={onClose}>
            <BottomSheetHeader title={title} />
            <View style={styles.container}>
                <Calendar
                    current={selectedString}
                    markedDates={{
                        [selectedString]: { selected: true, disableTouchEvent: true }
                    }}
                    onDayPress={(day: any) => {
                        const newDate = new Date(day.timestamp);
                        onSelectDate(newDate);
                        onClose();
                    }}
                    theme={{
                        calendarBackground: COLORS.background,
                        textSectionTitleColor: COLORS.textSecondary,
                        selectedDayBackgroundColor: COLORS.primary,
                        selectedDayTextColor: COLORS.white,
                        todayTextColor: COLORS.primary,
                        dayTextColor: COLORS.textPrimary,
                        textDisabledColor: COLORS.border,
                        arrowColor: COLORS.primary,
                        monthTextColor: COLORS.textPrimary,
                        textDayFontFamily: 'HankenGrotesk_500Medium',
                        textMonthFontFamily: 'HankenGrotesk_600SemiBold',
                        textDayHeaderFontFamily: 'HankenGrotesk_600SemiBold',
                        textDayFontSize: 15,
                        textMonthFontSize: 16,
                        textDayHeaderFontSize: 13,
                        'stylesheet.calendar.header': {
                            header: {
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                paddingLeft: 10,
                                paddingRight: 10,
                                marginTop: 6,
                                alignItems: 'center'
                            }
                        }
                    }}
                />
            </View>
        </BottomSheetModal>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingBottom: 24,
    }
});
