import React from 'react';
import { View, Image, Text } from 'react-native';
import createStyles from '../../assets/styles/auth.styles';
import { COLORS } from '../../constants/theme';

export default function AuthLogo() {
    const styles = createStyles(COLORS);
    return (
        <View style={styles.logoRow}>
            <Image source={require('../../../assets/images/mind_wallet_logo_black.png')} style={{ width: 64, height: 64 }} resizeMode="contain" />
            <Text style={styles.logoText}>Mind Wallet</Text>
        </View>
    );
}
