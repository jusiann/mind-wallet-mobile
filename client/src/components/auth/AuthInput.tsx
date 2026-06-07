import React from 'react';
import { View, Text, TextInput, TextInputProps, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import createStyles from '../../assets/styles/auth.styles';
import { COLORS } from '../../constants/theme';

interface Props extends TextInputProps {
    label: string;
    icon: React.ComponentProps<typeof Ionicons>['name'];
    rightLink?: {
        text: string;
        onPress: () => void;
    };
    containerStyle?: StyleProp<ViewStyle>;
}

export default function AuthInput({ label, icon, rightLink, containerStyle, ...textInputProps }: Props) {
    const styles = createStyles(COLORS);
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
                    name={icon}
                    size={20}
                    color={COLORS.placeholderText}
                    style={styles.inputIcon}
                />
                <TextInput
                    style={styles.input}
                    underlineColorAndroid="transparent"
                    {...textInputProps}
                />
            </View>
        </View>
    );
}
