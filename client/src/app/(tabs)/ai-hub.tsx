import { Text, View } from 'react-native';
import { COLORS } from '../../constants/theme';

export default function AiHubScreen() {
    return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background }}>
            <Text style={{ color: COLORS.textSecondary }}>AI Hub — yakında</Text>
        </View>
    );
}
