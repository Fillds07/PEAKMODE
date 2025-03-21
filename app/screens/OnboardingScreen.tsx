import React, { useState } from 'react';
import { StyleSheet, ScrollView, View, TextInput, Text } from 'react-native';
import { Button } from '@rneui/themed';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const OnboardingScreen = () => {
  const [userInfo, setUserInfo] = useState({
    name: '',
    age: '',
    gender: '',
    height: '',
    weight: '',
  });

  const handleChange = (field: string, value: string) => {
    setUserInfo({ ...userInfo, [field]: value });
  };

  const handleSubmit = async () => {
    try {
      // Save user info to AsyncStorage
      await AsyncStorage.setItem('userInfo', JSON.stringify(userInfo));
      // Mark onboarding as complete
      await AsyncStorage.setItem('onboardingComplete', 'true');
      // Then navigate to main app
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error saving user info:', error);
      // Navigate anyway in case of error
      router.replace('/(tabs)');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoGraphic}>
          <View style={styles.dropOuter}>
            <View style={styles.dropInner}>
              <View style={styles.lightningContainer}>
                <View style={styles.lightningBolt}></View>
                <View style={styles.lightningSmile}></View>
              </View>
            </View>
          </View>
        </View>
        <Text style={styles.title}>PEAKMODE</Text>
        <Text style={styles.subtitle}>ENERGY UNLOCKED</Text>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.formTitle}>Tell us about yourself</Text>
        <Text style={styles.formDescription}>
          We'll use this information to personalize your supplement recommendations
        </Text>

        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={userInfo.name}
          onChangeText={(value) => handleChange('name', value)}
          placeholder="Enter your name"
        />

        <Text style={styles.label}>Age</Text>
        <TextInput
          style={styles.input}
          value={userInfo.age}
          onChangeText={(value) => handleChange('age', value)}
          placeholder="Enter your age"
          keyboardType="numeric"
        />

        <Text style={styles.label}>Gender</Text>
        <TextInput
          style={styles.input}
          value={userInfo.gender}
          onChangeText={(value) => handleChange('gender', value)}
          placeholder="Enter your gender"
        />

        <Text style={styles.label}>Height (cm)</Text>
        <TextInput
          style={styles.input}
          value={userInfo.height}
          onChangeText={(value) => handleChange('height', value)}
          placeholder="Enter your height in cm"
          keyboardType="numeric"
        />

        <Text style={styles.label}>Weight (kg)</Text>
        <TextInput
          style={styles.input}
          value={userInfo.weight}
          onChangeText={(value) => handleChange('weight', value)}
          placeholder="Enter your weight in kg"
          keyboardType="numeric"
        />

        <Button
          title="Get Started"
          buttonStyle={styles.button}
          containerStyle={styles.buttonContainer}
          onPress={handleSubmit}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    alignItems: 'center',
    padding: 20,
    marginTop: 40,
    marginBottom: 20,
  },
  logoGraphic: {
    alignItems: 'center',
    marginBottom: 15,
  },
  dropOuter: {
    width: 100,
    height: 120,
    borderRadius: 50,
    borderWidth: 8,
    borderColor: '#0F1A2D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#F5B431',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E8941A',
    shadowOffset: { width: -5, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 0,
    elevation: 5,
  },
  lightningContainer: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  lightningBolt: {
    width: 25,
    height: 35,
    backgroundColor: 'white',
    borderRadius: 3,
    transform: [
      { rotate: '20deg' },
      { skewX: '-15deg' },
      { translateX: -2 }
    ],
    position: 'relative',
    zIndex: 2,
  },
  lightningSmile: {
    position: 'absolute',
    bottom: 15,
    right: 15,
    width: 12,
    height: 12,
    borderBottomWidth: 2.5,
    borderRightWidth: 2.5,
    borderColor: 'white',
    borderBottomRightRadius: 8,
    transform: [{ rotate: '45deg' }],
    zIndex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#F5B431',
    marginBottom: 5,
    letterSpacing: 1.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#0F1A2D',
    letterSpacing: 3,
    fontWeight: '600',
  },
  formContainer: {
    padding: 20,
    backgroundColor: '#f9f9f9',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  formDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 25,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 5,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    fontSize: 16,
    backgroundColor: 'white',
  },
  buttonContainer: {
    marginTop: 10,
  },
  button: {
    backgroundColor: '#F5B431',
    borderRadius: 10,
    padding: 15,
  },
});

export default OnboardingScreen; 