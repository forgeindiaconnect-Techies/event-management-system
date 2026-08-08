import { router } from 'expo-router';
import { Image, SafeAreaView, StyleSheet, Text, TouchableOpacity, View, StatusBar } from 'react-native';

export default function LandingScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#5b3cc4" />
      <View style={styles.container}>
        
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=400&auto=format&fit=crop' }} 
              style={styles.logoImage} 
            />
          </View>
          <Text style={styles.title}>Event Booking</Text>
          <Text style={styles.subtitle}>Discover, book, and experience the best events happening around you.</Text>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.button} 
            onPress={() => router.push('/login')}
          >
            <Text style={styles.buttonText}>Get Started</Text>
          </TouchableOpacity>
        </View>
        
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#5b3cc4',
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 32,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 30,
    overflow: 'hidden',
    marginBottom: 32,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#d9d8fa',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  footer: {
    paddingBottom: 24,
  },
  button: {
    backgroundColor: '#ffffff',
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#5b3cc4',
  },
});
