import { StyleSheet } from 'react-native';
import { View, Text, ScrollView } from 'react-native';
import { Icon } from '@rneui/themed';

export default function ExploreScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>About PEAKMODE</Text>
      </View>
      
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Icon name="lightbulb-outline" type="material" color="#DAA520" size={24} />
          <Text style={styles.sectionTitle}>Our Mission</Text>
        </View>
        <Text style={styles.sectionText}>
          PEAKMODE helps you optimize your energy levels and health through personalized supplement 
          tracking and education on nutrition, fasting, and exercise.
        </Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Icon name="rocket" type="font-awesome" color="#DAA520" size={20} />
          <Text style={styles.sectionTitle}>How It Works</Text>
        </View>
        <Text style={styles.sectionText}>
          1. Track your supplements in one place{'\n'}
          2. Learn about proper nutrition and supplement use{'\n'}
          3. Set reminders to stay consistent{'\n'}
          4. Get personalized advice from our AI assistant
        </Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Icon name="award" type="font-awesome-5" color="#DAA520" size={18} />
          <Text style={styles.sectionTitle}>Benefits</Text>
        </View>
        <Text style={styles.sectionText}>
          • Improved energy levels{'\n'}
          • Better nutrient tracking{'\n'}
          • Personalized supplement recommendations{'\n'}
          • Deeper understanding of health optimization{'\n'}
          • Consistent supplement usage
        </Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Icon name="info-circle" type="font-awesome" color="#DAA520" size={20} />
          <Text style={styles.sectionTitle}>About Version 1.0</Text>
        </View>
        <Text style={styles.sectionText}>
          This is the first version of PEAKMODE. We're constantly working to improve the app
          and add new features. Your feedback is valuable to us!
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  header: {
    marginVertical: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  section: {
    marginBottom: 25,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 10,
  },
  sectionText: {
    fontSize: 16,
    color: '#555',
    lineHeight: 24,
  },
});
