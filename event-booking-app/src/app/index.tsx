import React, { useState, useRef } from 'react';
import { router } from 'expo-router';
import { 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View, 
  StatusBar,
  ScrollView,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Platform,
  Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

// Figma base dimensions
const FIGMA_WIDTH = 390;
const FIGMA_HEIGHT = 844;

// We scale the 390x844 frame to fit the screen width
const scale = width / FIGMA_WIDTH;

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    setStep(Math.round(index));
  };

  const handleNext = () => {
    if (step < 2) {
      scrollRef.current?.scrollTo({ x: (step + 1) * width, animated: true });
    } else {
      router.push('/login');
    }
  };

  const handleSkip = () => {
    router.push('/login');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4F3F6" />
      
      {/* Fixed Skip Button in Top Right Corner */}
      <TouchableOpacity 
        style={[
          styles.skipButtonFixed,
          { backgroundColor: step === 0 ? '#FFFFFF' : 'rgba(255, 255, 255, 0.7)' }
        ]} 
        onPress={handleSkip}
      >
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        bounces={false}
        style={styles.scrollView}
      >
        {/* PAGE 1 */}
        <View style={styles.page}>
          <View style={styles.figmaFrame}>
            <View style={styles.image1Container}>
               <Image 
                 source={require('../../assets/images/image 1446.png')} 
                 style={styles.imagePlaceholderBase}
                 resizeMode="cover"
               />
            </View>
            
            <LinearGradient
              colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.9)', '#FFFFFF']}
              locations={[0, 0.3, 0.5]}
              style={styles.blurArea1}
            />

            <View style={[styles.textBlock, { left: 16, top: 574 }]}>
              <Text style={styles.title}>Discover Events You’ll Love</Text>
              <Text style={styles.subtitle}>Explore amazing events happening around you from music and sports to technology, education, and more.</Text>
            </View>
          </View>
        </View>

        {/* PAGE 2 */}
        <View style={styles.page}>
          <View style={styles.figmaFrame}>
            <View style={{ top: -40 }}>
              {/* Group 1686559125 */}
              <View style={[styles.group, { left: 98, top: 84, width: 123, height: 131 }]}>
                <Image source={require('../../assets/images/Group 1686559125.png')} style={styles.imageFull} resizeMode="contain" />
              </View>

              {/* Group 1686559126 */}
              <View style={[styles.group, { left: 234.09, top: 192.56, width: 123, height: 131, transform: [{ rotate: '6.39deg' }] }]}>
                <Image source={require('../../assets/images/Group 1686559126.png')} style={styles.imageFull} resizeMode="contain" />
              </View>

              {/* Group 1686559127 */}
              <View style={[styles.group, { left: 234, top: 432, width: 123, height: 132 }]}>
                <Image source={require('../../assets/images/Group 1686559127.png')} style={styles.imageFull} resizeMode="contain" />
              </View>

              {/* Group 1686559129 */}
              <View style={[styles.group, { left: 83.62, top: 487.54, width: 82, height: 88, transform: [{ rotate: '15.71deg' }] }]}>
                <Image source={require('../../assets/images/Group 1686559129.png')} style={styles.imageFull} resizeMode="contain" />
              </View>

              {/* Group 1686559128 */}
              <View style={[styles.group, { left: 10, top: 248, width: 174, height: 185.32, transform: [{ rotate: '-12.93deg' }] }]}>
                <Image source={require('../../assets/images/Group 1686559128.png')} style={styles.imageFull} resizeMode="contain" />
              </View>
            </View>

            <View style={[styles.textBlock, { left: 29, top: 585 }]}>
              <Text style={styles.title}>Find What Interests You</Text>
              <Text style={styles.subtitle}>Choose your interests and get personalized events, workshops, concerts, meetups, and experiences.</Text>
            </View>
          </View>
        </View>

        {/* PAGE 3 */}
        <View style={styles.page}>
          <View style={styles.figmaFrame}>
            <View style={styles.image3Container}>
               <Image 
                 source={require('../../assets/images/image 1449.png')} 
                 style={styles.imageFull}
                 resizeMode="contain"
               />
            </View>
            
            <LinearGradient
              colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.9)', '#FFFFFF']}
              locations={[0, 0.3, 0.5]}
              style={[styles.blurArea3, { top: 545 }]}
            />

            <View style={[styles.textBlock, { left: 16, top: 585 }]}>
              <Text style={styles.title}>Book & Enjoy</Text>
              <Text style={styles.subtitle}>Book your tickets in just a few taps and keep all your event tickets in one place.</Text>
            </View>
          </View>
        </View>

      </ScrollView>

      {/* Footer Controls (Fixed overlay) */}
      <View style={[styles.pagerContainer, { bottom: 48 }]}>
        <View style={step === 0 ? styles.dotActive : styles.dotInactive} />
        <View style={step === 1 ? styles.dotActive : styles.dotInactive} />
        <View style={step === 2 ? styles.dotActive : styles.dotInactive} />
      </View>

      <TouchableOpacity 
        style={[styles.nextButton, { bottom: 32 }]} 
        onPress={handleNext}
      >
        <Text style={styles.nextText}>Next</Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F3F6',
    paddingTop: Platform?.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  scrollView: {
    flex: 1,
  },
  page: {
    width: width,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F4F3F6',
  },
  figmaFrame: {
    width: FIGMA_WIDTH,
    height: FIGMA_HEIGHT,
    backgroundColor: '#F4F3F6',
    transform: [{ scale: scale }],
    // Keeps the top edge bound to the top of the screen if device is taller than 844 scaled
    position: 'absolute',
    top: 0,
  },
  skipButtonFixed: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 20,
    zIndex: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 20,
  },
  skipButton: {
    position: 'absolute',
    width: 30,
    height: 20,
    left: 344,
    zIndex: 10,
  },
  skipText: {
    fontFamily: 'Outfit',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 20,
    color: '#7931ED',
  },
  imageFull: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholderBase: {
    width: '100%',
    height: '100%',
    backgroundColor: '#D9D9D9',
  },
  imagePlaceholderIcon: {
    width: '100%',
    height: '100%',
    backgroundColor: '#D9D9D9',
    borderRadius: 16,
  },
  image1Container: {
    position: 'absolute',
    width: 524,
    height: 787,
    left: (390 / 2) - (524 / 2) - 30, 
    top: (844 / 2) - (787 / 2) - 86.86,
    transform: [{ rotate: '15.25deg' }],
  },
  image3Container: {
    position: 'absolute',
    width: 304,
    height: 456,
    left: (390 / 2) - (304 / 2),
    top: (844 / 2) - (456 / 2) - 106, // shifted up by 40px
  },
  group: {
    position: 'absolute',
  },

  blurArea1: {
    position: 'absolute',
    width: 491,
    height: 483, // Increased to compensate for moving up
    left: (390 / 2) - (491 / 2) - 9.5,
    top: 450, // Moved up from 511
  },
  blurArea3: {
    position: 'absolute',
    width: 491,
    height: 506, // Increased to compensate for moving up
    left: (390 / 2) - (491 / 2) - 12.5,
    top: 480, // Moved up from 545
  },
  textBlock: {
    position: 'absolute',
    width: 332,
    flexDirection: 'column',
    gap: 8,
  },
  title: {
    width: 332,
    fontFamily: 'Outfit',
    fontWeight: '400',
    fontSize: 20,
    lineHeight: 25,
    color: '#000000',
  },
  subtitle: {
    width: 332,
    fontFamily: 'Outfit',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    color: '#7C858D',
  },
  pagerContainer: {
    position: 'absolute',
    width: 48,
    height: 8,
    left: 16 * scale, // scale X coordinates for floating footer
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dotActive: {
    width: 24,
    height: 8,
    backgroundColor: '#7931ED',
    borderRadius: 12,
  },
  dotInactive: {
    width: 8,
    height: 8,
    backgroundColor: '#EAE9EC',
    borderRadius: 8,
  },
  nextButton: {
    position: 'absolute',
    width: 110,
    height: 44,
    left: 264 * scale, // scale X coordinates for floating footer
    backgroundColor: '#7931ED',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextText: {
    fontFamily: 'Outfit',
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 20,
    color: '#F0F0F0',
  },
});
