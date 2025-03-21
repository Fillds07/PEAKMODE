import React from 'react';
import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Icon } from '@rneui/themed';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#DAA520',
        tabBarInactiveTintColor: '#999',
        tabBarLabelStyle: {
          fontWeight: '500',
        },
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Supplements',
          tabBarIcon: ({ color }) => (
            <Icon name="healing" type="material" color={color} />
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            // Import the screen directly
            const SupplementStackScreen = require('../screens/SupplementStackScreen').default;
            navigation.navigate('index', { screen: SupplementStackScreen });
          },
        })}
      />
      <Tabs.Screen
        name="education"
        options={{
          title: 'Learn',
          tabBarIcon: ({ color }) => (
            <Icon name="book-open-page-variant" type="material-community" color={color} />
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            // Import the screen directly
            const EducationScreen = require('../screens/EducationScreen').default;
            navigation.navigate('education', { screen: EducationScreen });
          },
        })}
      />
      <Tabs.Screen
        name="reminders"
        options={{
          title: 'Reminders',
          tabBarIcon: ({ color }) => (
            <Icon name="bell" type="font-awesome" color={color} />
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            // Import the screen directly
            const ReminderScreen = require('../screens/ReminderScreen').default;
            navigation.navigate('reminders', { screen: ReminderScreen });
          },
        })}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'AI Assistant',
          tabBarIcon: ({ color }) => (
            <Icon name="chat" type="material" color={color} />
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            // Import the screen directly
            const ChatbotScreen = require('../screens/ChatbotScreen').default;
            navigation.navigate('chat', { screen: ChatbotScreen });
          },
        })}
      />
    </Tabs>
  );
}
