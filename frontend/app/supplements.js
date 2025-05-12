import React from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  SafeAreaView,
  ScrollView,
  Image
} from 'react-native';
import Logo from '../services/logoComponent';
import { withAuth } from '../services/authContext';

// PEAKMODE color theme based on logo
const COLORS = {
  primary: '#F7B233', // Yellow/orange from logo
  secondary: '#FFFFFF', // White for background
  text: '#333333', // Dark text
  textSecondary: '#777777', // Secondary text
  background: '#F5F5F5', // Light gray background
  cardBg: '#FFFFFF', // White background for cards
  inputBg: '#F9F9F9', // Light gray for input backgrounds
  border: '#DDDDDD', // Light gray for borders
  error: '#FF6B6B', // Red for errors
  success: '#4CAF50', // Green for success
}

function SupplementsScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Logo width={180} />
          <Text style={styles.title}>Supplement Stack</Text>
        </View>
        
        <View style={styles.card}>
          <Text style={styles.comingSoonText}>Coming Soon</Text>
          <Text style={styles.descriptionText}>
            Your personalized supplement tracking and recommendation platform is under development.
            Get expert advice on optimal supplementation for your fitness goals.
          </Text>
        </View>

        <View style={styles.featureCard}>
          <Text style={styles.featureTitle}>Planned Features</Text>
          <View style={styles.featureItem}>
            <Text style={styles.featureText}>• Custom supplement stacks</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureText}>• Timing and dosage tracking</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureText}>• Expert recommendations</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureText}>• Integration with nutrition tracker</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureText}>• Reminder notifications</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Wrap the component with the auth HOC
export default withAuth(SupplementsScreen);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 12,
  },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
    marginBottom: 20,
  },
  comingSoonText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 16,
  },
  descriptionText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  featureCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  featureItem: {
    marginBottom: 12,
  },
  featureText: {
    fontSize: 16,
    color: COLORS.text,
    lineHeight: 24,
  },
}); 