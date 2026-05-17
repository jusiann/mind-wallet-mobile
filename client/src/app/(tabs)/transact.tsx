import { Text, View } from 'react-native';
import { COLORS } from '../../constants/theme';

export default function TransactScreen() {
    return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background }}>
            <Text style={{ color: COLORS.textSecondary }}>İşlemler — yakında</Text>
        </View>
    );
}
