import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { router } from 'expo-router';
import Logo from '../services/logoComponent';
import { withAuth, useAuth } from '../services/authContext';

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
  accent: '#6C63FF', // Purple accent
  chart: '#F7B233', // Chart color
}

// Mock data for the dashboard
const mockSupplements = [
  { id: 1, name: 'Vitamin D3', dosage: '1000 IU', taken: true, time: '08:00 AM' },
  { id: 2, name: 'Omega-3', dosage: '1000 mg', taken: true, time: '08:00 AM' },
  { id: 3, name: 'Magnesium', dosage: '400 mg', taken: false, time: '08:00 PM' },
  { id: 4, name: 'Zinc', dosage: '30 mg', taken: false, time: '06:00 PM' },
];

const mockRecommendations = [
  { 
    id: 1, 
    name: 'Vitamin B12', 
    description: 'May help with energy levels and brain function', 
    confidence: 95,
    image: 'https://images.unsplash.com/photo-1584362917165-526a968579e8?q=80&w=200&auto=format'
  },
  { 
    id: 2, 
    name: 'Ashwagandha', 
    description: 'May help with stress and anxiety reduction', 
    confidence: 87,
    image: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?q=80&w=200&auto=format'
  },
];

const mockActivityData = [
  { id: 1, type: 'supplement', name: 'Took Vitamin D3', time: '2 hours ago' },
  { id: 2, type: 'learning', name: 'Completed "Basics of Nutrition" lesson', time: '1 day ago' },
  { id: 3, type: 'tracking', name: 'Updated sleep tracking data', time: '2 days ago' },
  { id: 4, type: 'recommendation', name: 'Received new supplement recommendations', time: '5 days ago' },
];

// Progress data for the chart
const chartData = {
  labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  datasets: [
    {
      data: [65, 75, 80, 70, 90, 85, 75],
      color: () => COLORS.chart,
      strokeWidth: 2
    }
  ],
  legend: ["Supplement Adherence %"]
};

function DashboardScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [todaySupplements, setTodaySupplements] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [activity, setActivity] = useState([]);
  const screenWidth = Dimensions.get("window").width - 40;

  // Load dashboard data
  useEffect(() => {
    // Simulate API loading
    const loadDashboardData = async () => {
      try {
        // In a real app, these would be API calls
        await new Promise(resolve => setTimeout(resolve, 800));
        setTodaySupplements(mockSupplements);
        setRecommendations(mockRecommendations);
        setActivity(mockActivityData);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // Calculate supplement stats
  const takenCount = todaySupplements.filter(s => s.taken).length;
  const totalCount = todaySupplements.length;
  const adherencePercentage = totalCount > 0 ? Math.round((takenCount / totalCount) * 100) : 0;

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Get icon for activity type
  const getActivityIcon = (type) => {
    switch (type) {
      case 'supplement': return 'medical-outline';
      case 'learning': return 'book-outline';
      case 'tracking': return 'analytics-outline';
      case 'recommendation': return 'flask-outline';
      default: return 'checkmark-circle-outline';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Header Section */}
        <View style={styles.header}>
          <Logo width={150} />
        </View>
        
        {/* User Summary Section */}
        <View style={styles.userSummaryCard}>
          <View style={styles.greetingRow}>
            <View>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.username}>{user?.name || 'User'}</Text>
            </View>
            <View style={styles.adherenceCircle}>
              <Text style={styles.adherenceText}>{adherencePercentage}%</Text>
              <Text style={styles.adherenceLabel}>Today</Text>
            </View>
          </View>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{takenCount}/{totalCount}</Text>
              <Text style={styles.statLabel}>Supplements Taken</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>7</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
          </View>
          
          <View style={styles.quickActionsRow}>
            <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/track')}>
              <Ionicons name="add-circle-outline" size={22} color={COLORS.primary} />
              <Text style={styles.actionButtonText}>Log Supplements</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/recommend')}>
              <Ionicons name="search-outline" size={22} color={COLORS.primary} />
              <Text style={styles.actionButtonText}>Find Supplements</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Today's Supplements Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Supplements</Text>
          <TouchableOpacity onPress={() => router.push('/track')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.supplementsContainer}>
          {todaySupplements.map((supplement) => (
            <TouchableOpacity 
              key={supplement.id} 
              style={[styles.supplementCard, supplement.taken && styles.supplementCardTaken]}
              onPress={() => router.push('/track')}
            >
              <View style={styles.supplementIconContainer}>
                {supplement.taken ? (
                  <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
                ) : (
                  <Ionicons name="time-outline" size={24} color={COLORS.textSecondary} />
                )}
              </View>
              <Text style={styles.supplementName}>{supplement.name}</Text>
              <Text style={styles.supplementDosage}>{supplement.dosage}</Text>
              <Text style={styles.supplementTime}>{supplement.time}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        {/* Progress Visualization Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Progress</Text>
        </View>
        
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Weekly Adherence</Text>
          <LineChart
            data={chartData}
            width={screenWidth - 20}
            height={180}
            chartConfig={{
              backgroundColor: COLORS.cardBg,
              backgroundGradientFrom: COLORS.cardBg,
              backgroundGradientTo: COLORS.cardBg,
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(247, 178, 51, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(51, 51, 51, ${opacity})`,
              style: {
                borderRadius: 16
              },
              propsForDots: {
                r: "5",
                strokeWidth: "2",
                stroke: COLORS.primary
              }
            }}
            bezier
            style={styles.chart}
          />
        </View>
        
        {/* Recommendations Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recommended For You</Text>
          <TouchableOpacity onPress={() => router.push('/recommend')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        
        {recommendations.map((recommendation) => (
          <TouchableOpacity 
            key={recommendation.id} 
            style={styles.recommendationCard}
            onPress={() => router.push('/recommend')}
          >
            <Image
              source={{ uri: recommendation.image }}
              style={styles.recommendationImage}
            />
            <View style={styles.recommendationContent}>
              <Text style={styles.recommendationName}>{recommendation.name}</Text>
              <Text style={styles.recommendationDescription}>
                {recommendation.description}
              </Text>
              <View style={styles.confidenceContainer}>
                <Text style={styles.confidenceText}>
                  {recommendation.confidence}% match
                </Text>
                <View style={styles.confidenceBar}>
                  <View
                    style={[
                      styles.confidenceFill, 
                      { width: `${recommendation.confidence}%` }
                    ]}
                  />
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
        
        {/* Activity Feed Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity onPress={() => router.push('/learn')}>
            <Text style={styles.seeAllText}>Learn More</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.activityCard}>
          {activity.map((item) => (
            <View key={item.id} style={styles.activityItem}>
              <View style={styles.activityIconContainer}>
                <Ionicons name={getActivityIcon(item.type)} size={20} color={COLORS.primary} />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityName}>{item.name}</Text>
                <Text style={styles.activityTime}>{item.time}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.text,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  userSummaryCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  greeting: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  username: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  adherenceCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adherenceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.secondary,
  },
  adherenceLabel: {
    fontSize: 12,
    color: COLORS.secondary,
  },
  statsContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    backgroundColor: COLORS.inputBg,
    padding: 16,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  divider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 10,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.inputBg,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flex: 1,
    marginHorizontal: 4,
  },
  actionButtonText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  seeAllText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  supplementsContainer: {
    marginBottom: 24,
  },
  supplementCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    marginRight: 12,
    width: 130,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  supplementCardTaken: {
    borderColor: COLORS.success,
    borderWidth: 1,
  },
  supplementIconContainer: {
    marginBottom: 12,
  },
  supplementName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  supplementDosage: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  supplementTime: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  chartCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  chart: {
    borderRadius: 16,
    paddingRight: 16,
  },
  recommendationCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  recommendationImage: {
    width: 100,
    height: 'auto',
    aspectRatio: 1,
  },
  recommendationContent: {
    padding: 16,
    flex: 1,
  },
  recommendationName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
  },
  recommendationDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 10,
    lineHeight: 20,
  },
  confidenceContainer: {
    marginTop: 'auto',
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.success,
    marginBottom: 4,
  },
  confidenceBar: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: COLORS.success,
  },
  activityCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  activityIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF5E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityName: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});

// Wrap the component with the auth HOC
export default withAuth(DashboardScreen); 