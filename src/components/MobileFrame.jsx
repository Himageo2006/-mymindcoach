import { View, StyleSheet, Platform } from 'react-native';

export default function MobileFrame({ children }) {
  if (Platform.OS !== 'web') return children;
  return (
    <View style={styles.outer}>
      <View style={styles.phone}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  phone: {
    width: 390,
    height: '100%',
    maxHeight: 844,
    backgroundColor: '#F5F3FF',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 20 },
  },
});
