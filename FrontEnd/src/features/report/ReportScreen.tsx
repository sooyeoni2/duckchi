import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export function ReportScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>리포트</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F3F5',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
});
