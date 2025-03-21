import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, Animated, Image } from 'react-native';
import { Button } from '@rneui/themed';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SplashScreen() {
  const fadeAnim = new Animated.Value(0);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    // Fade in the logo
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start(() => {
      // After fadeIn animation completes, show the button
      setShowButton(true);
    });
  }, []);

  const handleContinue = async () => {
    try {
      const onboardingComplete = await AsyncStorage.getItem('onboardingComplete');
      if (onboardingComplete === 'true') {
        router.replace('/(tabs)');
      } else {
        router.replace('/screens/OnboardingScreen');
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      router.replace('/screens/OnboardingScreen');
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[{ opacity: fadeAnim }, styles.logoContainer]}>
        <Image 
          source={require('../../assets/images/fulllogo_nobuffer.png')} 
          style={styles.logoImage}
          resizeMode="contain"
        />
      </Animated.View>

      {showButton && (
        <Button
          title="Get Started"
          buttonStyle={styles.button}
          containerStyle={styles.buttonContainer}
          onPress={handleContinue}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoImage: {
    width: 350,
    height: 280,
    marginBottom: 40,
  },
  buttonContainer: {
    width: '80%',
    marginTop: 60,
  },
  button: {
    backgroundColor: '#F5B431',
    borderRadius: 10,
    padding: 15,
  }
}); 