import React, { useState } from 'react';
import { View, Text, TextInput, TextInputProps, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import createStyles from '../../assets/styles/auth.styles';
import { COLORS } from '../../constants/theme';

interface Props extends TextInputProps {
    label: string;
    rightLink?: {
        text: string;
        onPress: () => void;
    };
    containerStyle?: StyleProp<ViewStyle>;
}

export default function AuthPasswordInput({ label, rightLink, containerStyle, ...textInputProps }: Props) {
    const styles = createStyles(COLORS);
    const [showPassword, setShowPassword] = useState(false);

    return (
        <View style={[styles.inputGroup, containerStyle]}>
            <View style={styles.inputLabelRow}>
                <Text style={styles.inputLabel}>{label}</Text>
                {rightLink && (
                    <TouchableOpacity onPress={rightLink.onPress}>
                        <Text style={styles.forgotPasswordLink}>{rightLink.text}</Text>
                    </TouchableOpacity>
                )}
            </View>
            <View style={styles.inputContainer}>
                <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={COLORS.placeholderText}
                    style={styles.inputIcon}
                />
                <TextInput
                    style={styles.input}
                    secureTextEntry={!showPassword}
                    underlineColorAndroid="transparent"
                    autoCapitalize="none"
                    autoCorrect={false}
                    {...textInputProps}
                />
                <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                >
                    <Ionicons
                        name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                        size={20}
                        color={COLORS.placeholderText}
                    />
                </TouchableOpacity>
            </View>
        </View>
    );
}
