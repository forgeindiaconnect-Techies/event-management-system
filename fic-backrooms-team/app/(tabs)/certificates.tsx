import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, StyleSheet, Text, View, TouchableOpacity } from 'react-native';

export default function CertificatesScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 }} onPress={() => router.push('/')}>
          <Ionicons name="arrow-back" size={20} color="#1e1b3d" />
          <Text style={{ fontSize: 14, color: '#1e1b3d', fontWeight: '600' }}>Back to Home</Text>
        </TouchableOpacity>
        <Text style={styles.text}>Certificates functionality will go here.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f7f7fc' },
  header: { padding: 22, paddingTop: 60, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#eceaf3' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#1e1b3d' },
  content: { padding: 20, flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 16, color: '#68667a' },
});
