import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
  ImageBackground,
  Dimensions,
  StatusBar,
  Image,
  Alert
} from 'react-native';

const { width, height } = Dimensions.get('window');

// Using Figma scale ratio to keep proportions somewhat similar
const scale = Math.min(width / 390, height / 844);

export default function LoginScreen() {
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');

  const handleContinue = async () => {
    if (!name.trim() || !phoneNumber.trim()) {
      Alert.alert('Required Fields', 'Please enter your Full Name and Mobile Number to continue. You can also choose to Skip.');
      return;
    }

    await SecureStore.setItemAsync('user_name', name.trim());
    await SecureStore.setItemAsync('user_phone', phoneNumber.trim());

    if (email.trim()) await SecureStore.setItemAsync('user_email', email.trim());
    else await SecureStore.deleteItemAsync('user_email');
    
    router.replace('/home');
  };

  const handleSkip = async () => {
    await SecureStore.deleteItemAsync('user_name');
    await SecureStore.deleteItemAsync('user_phone');
    await SecureStore.deleteItemAsync('user_email');
    router.replace('/home');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Background Image Layer */}
      <ImageBackground 
        source={require('../../assets/images/image 1477.png')} 
        style={styles.backgroundImage}
      >
        <View style={styles.overlay} />
        
        <SafeAreaView style={styles.headerSafeArea}>
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={() => { if (router.canGoBack()) { router.back(); } else { router.replace('/'); } }} 
              style={styles.logoBtn}
            >
              <Image 
                source={require('../../assets/images/Frame 2147234592.png')} 
                style={styles.logoImage} 
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ImageBackground>

      {/* Foreground Form Layer */}
      <KeyboardAvoidingView 
        style={styles.keyboardContainer} 
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.bottomSheet}>
          <ScrollView 
            contentContainerStyle={styles.scrollGrow}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
            overScrollMode="never"
          >
            <Text style={styles.title}>Welcome!</Text>

            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Full Name</Text>
              <View style={styles.inputContainer}>
                <TextInput 
                  style={styles.input}
                  placeholder="Enter Name" 
                  placeholderTextColor="#837C8D"
                  autoCapitalize="words"
                  value={name}
                  onChangeText={setName}
                />
              </View>
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Mobile Number</Text>
              <View style={styles.inputContainer}>
                <TextInput 
                  style={styles.input}
                  placeholder="Enter Mobile Number"
                  placeholderTextColor="#837C8D"
                  keyboardType="phone-pad"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                />
              </View>
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Email Address <Text style={styles.optionalText}>(If Available)</Text></Text>
              <View style={styles.inputContainer}>
                <TextInput 
                  style={styles.input}
                  placeholder="Enter Email Address"
                  placeholderTextColor="#837C8D"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            <View style={{ flex: 1 }} />

            <TouchableOpacity style={styles.continueBtn} onPress={handleContinue}>
              <Text style={styles.continueBtnText}>Continue</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
              <Text style={styles.skipBtnText}>Skip</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F3F6',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 696 * scale, // Figma height
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(3, 3, 3, 0.32)',
  },
  headerSafeArea: {
    width: '100%',
    paddingTop: Platform.OS === 'android' ? 10 : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingLeft: 10,
    paddingTop: 10,
  },
  logoBtn: {
    padding: 0,
  },
  logoImage: {
    width: 161,
    height: 114, // Scaled up logo
  },
  keyboardContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopRightRadius: 160 * scale,
    paddingTop: 32,
    paddingHorizontal: 20,
    height: Math.max(540 * scale, 520), // Increased slightly and guaranteed minimum to prevent scrolling
  },
  scrollGrow: {
    flexGrow: 1,
    paddingBottom: 40, // Restored to give Skip button proper spacing at the bottom
  },
  title: {
    fontSize: 26,
    fontWeight: '500',
    color: '#2E2C30',
    marginBottom: 24,
    textAlign: 'left',
    alignSelf: 'flex-start',
    width: '100%',
  },
  inputWrapper: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2E2C30',
    marginBottom: 8,
  },
  optionalText: {
    color: '#837C8D',
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: '#EAE9EC',
    borderRadius: 16,
    height: 44,
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    fontSize: 12,
    color: '#2E2C30',
    fontWeight: '500',
  },
  continueBtn: {
    backgroundColor: '#7931ED',
    borderRadius: 16,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  continueBtnText: {
    color: '#FAFAFA',
    fontSize: 14,
    fontWeight: '500',
  },
  skipBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    padding: 8,
  },
  skipBtnText: {
    color: '#7931ED',
    fontSize: 14,
    fontWeight: '500',
  }
});
