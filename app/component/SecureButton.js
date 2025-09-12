import React from 'react';
import { requireNativeComponent, StyleSheet } from 'react-native';

// Link to the native view name (from SecureButtonManager.getName())
const RNSecureButton = requireNativeComponent('SecureButton');

export default function SecureButton({ text, style, textStyle, onPress }) {
  // Flatten textStyle to avoid array being passed to native component
  const flattenedTextStyle = StyleSheet.flatten([styles.defaultText, textStyle]);

  return (
    <RNSecureButton
      text={text}
      style={[styles.default, style]}
      textStyle={flattenedTextStyle}
      onPress={onPress}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  defaultText: {
    fontSize: 16,
    color: '#000000',
    fontWeight: 'normal',
    textAlign: 'center',
  },
});