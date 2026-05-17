import { Text, View } from 'react-native';
import { COLORS } from '../../constants/theme';

export default function GoalsScreen() {
    return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background }}>
            <Text style={{ color: COLORS.textSecondary }}>Hedefler — yakında</Text>
        </View>
    );
}
