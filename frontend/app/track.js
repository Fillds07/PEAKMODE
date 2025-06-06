import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Switch,
  Modal,
  FlatList,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Logo from '../services/logoComponent';
import { withAuth, useAuth } from '../services/authContext';
import { useTheme } from '../services/themeContext';
import { getThemedStyles } from '../services/themeHelper';

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
}

// Mock data for supplements
const mockSupplements = [
  { 
    id: 1, 
    name: 'Vitamin D3', 
    dosage: '1000 IU', 
    schedule: ['morning'],
    image: 'https://images.unsplash.com/photo-1584362917165-526a968579e8?q=80&w=200&auto=format',
    color: '#FFD166',
    description: 'Supports bone health and immune function',
    takenToday: true,
    timesTaken: 45,
    streak: 7,
    category: 'Vitamin',
    reminder: true,
    reminderTime: '08:00 AM',
  },
  { 
    id: 2, 
    name: 'Omega-3', 
    dosage: '1000 mg', 
    schedule: ['morning'],
    image: 'https://images.unsplash.com/photo-1584363539225-4d0420e52b5e?q=80&w=200&auto=format',
    color: '#06D6A0',
    description: 'Supports heart and brain health',
    takenToday: true,
    timesTaken: 30,
    streak: 7,
    category: 'Fatty Acid',
    reminder: true,
    reminderTime: '08:00 AM',
  },
  { 
    id: 3, 
    name: 'Magnesium', 
    dosage: '400 mg', 
    schedule: ['evening'],
    image: 'https://images.unsplash.com/photo-1584363545591-43ffe646b655?q=80&w=200&auto=format',
    color: '#118AB2',
    description: 'Supports muscle and nerve function',
    takenToday: false,
    timesTaken: 20,
    streak: 3,
    category: 'Mineral',
    reminder: true,
    reminderTime: '08:00 PM',
  },
  { 
    id: 4, 
    name: 'Zinc', 
    dosage: '30 mg', 
    schedule: ['evening'],
    image: 'https://images.unsplash.com/photo-1584386453939-c7e7a0092f7a?q=80&w=200&auto=format',
    color: '#EF476F',
    description: 'Supports immune function and wound healing',
    takenToday: false,
    timesTaken: 15,
    streak: 0,
    category: 'Mineral',
    reminder: true,
    reminderTime: '06:00 PM',
  },
  { 
    id: 5, 
    name: 'Vitamin C', 
    dosage: '500 mg', 
    schedule: ['morning', 'evening'],
    image: 'https://images.unsplash.com/photo-1620315808304-66597517f188?q=80&w=200&auto=format',
    color: '#F78C6B',
    description: 'Antioxidant that supports immune function',
    takenToday: false,
    timesTaken: 10,
    streak: 2,
    category: 'Vitamin',
    reminder: false,
    reminderTime: '10:00 AM',
  },
];

// Days of the week for calendar
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Mock historical data for the calendar view
const generateMockHistory = () => {
  const history = {};
  const today = new Date();
  
  // Generate data for last 14 days
  for (let i = 0; i < 14; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    // Random completion percentage between 70-100% for past dates
    const completionPercentage = i === 0 ? 50 : Math.floor(Math.random() * 30) + 70;
    
    history[dateStr] = {
      date: dateStr,
      completion: completionPercentage,
      supplements: mockSupplements.map(supp => ({
        id: supp.id,
        taken: Math.random() > 0.3, // 70% chance of having taken any supplement
      })),
    };
  }
  
  return history;
};

function TrackScreen() {
  const { user } = useAuth();
  const { colors, isDarkMode } = useTheme();
  const themedStyles = getThemedStyles(colors);
  
  const [loading, setLoading] = useState(true);
  const [supplements, setSupplements] = useState([]);
  const [supplementHistory, setSupplementHistory] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSupplement, setSelectedSupplement] = useState(null);
  const [stackView, setStackView] = useState(true); // true for Visual Stack, false for List view
  const screenWidth = Dimensions.get('window').width;
  
  // Load track data
  useEffect(() => {
    const loadTrackData = async () => {
      try {
        // In a real app, these would be API calls
        await new Promise(resolve => setTimeout(resolve, 800));
        setSupplements(mockSupplements);
        setSupplementHistory(generateMockHistory());
      } catch (error) {
        console.error('Error loading track data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTrackData();
  }, []);

  // Get today's completion percentage
  const getTodayCompletionPercentage = () => {
    const takenCount = supplements.filter(s => s.takenToday).length;
    return Math.round((takenCount / supplements.length) * 100);
  };

  // Toggle supplement taken status
  const toggleSupplementTaken = (id) => {
    setSupplements(prevSupplements => 
      prevSupplements.map(sup => 
        sup.id === id ? { ...sup, takenToday: !sup.takenToday } : sup
      )
    );
  };

  // Open supplement detail modal
  const openSupplementDetail = (supplement) => {
    setSelectedSupplement(supplement);
    setModalVisible(true);
  };

  // Generate dates for the calendar
  const generateCalendarDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      dates.push(date);
    }
    
    return dates;
  };

  // Get day status class based on completion
  const getDayStatusClass = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    const dayData = supplementHistory[dateStr];
    
    if (!dayData) return [styles.dayIncomplete, { backgroundColor: colors.border }];
    
    if (dayData.completion >= 90) return [styles.dayComplete, { backgroundColor: colors.success }];
    if (dayData.completion >= 50) return [styles.dayPartial, { backgroundColor: colors.primary }];
    return [styles.dayIncomplete, { backgroundColor: colors.border }];
  };

  // Format the current time for display
  const formatCurrentTime = () => {
    const now = new Date();
    const hours = now.getHours();
    return hours < 12 ? 'Morning' : hours < 17 ? 'Afternoon' : 'Evening';
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading supplement data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Filter supplements based on morning/evening
  const morningSupplements = supplements.filter(s => s.schedule.includes('morning'));
  const eveningSupplements = supplements.filter(s => s.schedule.includes('evening'));

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView 
        style={[styles.container, { backgroundColor: colors.background }]} 
        contentContainerStyle={styles.contentContainer}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <Logo width={150} />
          <Text style={[styles.title, { color: colors.text }]}>Track Supplements</Text>
        </View>
        
        {/* Calendar Section */}
        <View style={[styles.calendarCard, { backgroundColor: colors.cardBg, shadowColor: colors.text }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Tracking History</Text>
          
          <View style={styles.calendarContainer}>
            {generateCalendarDates().map((date, index) => (
              <TouchableOpacity 
                key={index} 
                style={[
                  styles.calendarDay,
                  date.toISOString().split('T')[0] === selectedDate && 
                    [styles.selectedDay, { borderColor: colors.primary }]
                ]}
                onPress={() => setSelectedDate(date.toISOString().split('T')[0])}
              >
                <Text style={[styles.dayName, { color: colors.textSecondary }]}>{DAYS[date.getDay()]}</Text>
                <View style={[styles.dayCircle, ...getDayStatusClass(date)]}>
                  <Text style={[styles.dayNumber, { color: colors.secondary }]}>{date.getDate()}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
          
          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, {backgroundColor: colors.success}]} />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>Complete</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, {backgroundColor: colors.primary}]} />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>Partial</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, {backgroundColor: colors.border}]} />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>Missed</Text>
            </View>
          </View>
        </View>
        
        {/* Today's Completion */}
        <View style={[styles.completionCard, { backgroundColor: colors.cardBg, shadowColor: colors.text }]}>
          <View style={styles.completionHeader}>
            <Text style={[styles.completionTitle, { color: colors.text }]}>Today's Progress</Text>
            <View style={[styles.completionCircle, { backgroundColor: colors.primary }]}>
              <Text style={[styles.completionPercentage, { color: colors.secondary }]}>{getTodayCompletionPercentage()}%</Text>
            </View>
          </View>
          
          <View style={[styles.progressBarContainer, { backgroundColor: colors.inputBg }]}>
            <View style={[styles.progressBar, {width: `${getTodayCompletionPercentage()}%`, backgroundColor: colors.primary}]} />
          </View>
          
          <Text style={[styles.completionText, { color: colors.textSecondary }]}>
            {getTodayCompletionPercentage() < 100 
              ? `You've taken ${supplements.filter(s => s.takenToday).length} of ${supplements.length} supplements today.`
              : "Great job! You've taken all your supplements today."}
          </Text>
        </View>
        
        {/* View Toggle */}
        <View style={[styles.viewToggleContainer, { backgroundColor: colors.inputBg }]}>
          <TouchableOpacity 
            style={[
              styles.viewToggleButton, 
              stackView && [styles.viewToggleActive, { backgroundColor: colors.cardBg }]
            ]} 
            onPress={() => setStackView(true)}
          >
            <Ionicons
              name="layers-outline"
              size={20}
              color={stackView ? colors.primary : colors.textSecondary}
            />
            <Text 
              style={[
                styles.viewToggleText, 
                { color: colors.textSecondary },
                stackView && { color: colors.primary }
              ]}
            >
              Stack View
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.viewToggleButton, 
              !stackView && [styles.viewToggleActive, { backgroundColor: colors.cardBg }]
            ]} 
            onPress={() => setStackView(false)}
          >
            <Ionicons
              name="list-outline"
              size={20}
              color={!stackView ? colors.primary : colors.textSecondary}
            />
            <Text 
              style={[
                styles.viewToggleText, 
                { color: colors.textSecondary },
                !stackView && { color: colors.primary }
              ]}
            >
              List View
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Visual Supplement Stack */}
        {stackView ? (
          <View style={styles.visualStackContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Supplement Stack</Text>
            <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>Good {formatCurrentTime()}</Text>
            
            <View style={styles.stackWrapper}>
              {/* Morning stack */}
              <View style={styles.timeStackContainer}>
                <Text style={[styles.stackTimeLabel, { color: colors.text }]}>Morning</Text>
                {morningSupplements.length > 0 ? (
                  <View style={styles.visualStack}>
                    {morningSupplements.map((supplement, index) => (
                      <TouchableOpacity
                        key={supplement.id}
                        style={[
                          styles.stackItem,
                          { 
                            backgroundColor: supplement.color,
                            marginTop: index > 0 ? -40 : 0,
                            zIndex: morningSupplements.length - index,
                          }
                        ]}
                        onPress={() => openSupplementDetail(supplement)}
                      >
                        <View style={styles.stackItemContent}>
                          <Text style={styles.stackItemName}>{supplement.name}</Text>
                          <Text style={styles.stackItemDosage}>{supplement.dosage}</Text>
                        </View>
                        
                        <TouchableOpacity
                          style={[
                            styles.checkButton,
                            supplement.takenToday && styles.checkedButton
                          ]}
                          onPress={() => toggleSupplementTaken(supplement.id)}
                        >
                          <Ionicons
                            name={supplement.takenToday ? "checkmark-circle" : "checkmark-circle-outline"}
                            size={28}
                            color={supplement.takenToday ? colors.secondary : "rgba(255,255,255,0.8)"}
                          />
                        </TouchableOpacity>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <View style={[styles.emptyStack, { backgroundColor: colors.inputBg }]}>
                    <Text style={[styles.emptyStackText, { color: colors.textSecondary }]}>No morning supplements</Text>
                  </View>
                )}
              </View>
              
              {/* Evening stack */}
              <View style={styles.timeStackContainer}>
                <Text style={[styles.stackTimeLabel, { color: colors.text }]}>Evening</Text>
                {eveningSupplements.length > 0 ? (
                  <View style={styles.visualStack}>
                    {eveningSupplements.map((supplement, index) => (
                      <TouchableOpacity
                        key={supplement.id}
                        style={[
                          styles.stackItem,
                          { 
                            backgroundColor: supplement.color,
                            marginTop: index > 0 ? -40 : 0,
                            zIndex: eveningSupplements.length - index,
                          }
                        ]}
                        onPress={() => openSupplementDetail(supplement)}
                      >
                        <View style={styles.stackItemContent}>
                          <Text style={styles.stackItemName}>{supplement.name}</Text>
                          <Text style={styles.stackItemDosage}>{supplement.dosage}</Text>
                        </View>
                        
                        <TouchableOpacity
                          style={[
                            styles.checkButton,
                            supplement.takenToday && styles.checkedButton
                          ]}
                          onPress={() => toggleSupplementTaken(supplement.id)}
                        >
                          <Ionicons
                            name={supplement.takenToday ? "checkmark-circle" : "checkmark-circle-outline"}
                            size={28}
                            color={supplement.takenToday ? colors.secondary : "rgba(255,255,255,0.8)"}
                          />
                        </TouchableOpacity>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <View style={[styles.emptyStack, { backgroundColor: colors.inputBg }]}>
                    <Text style={[styles.emptyStackText, { color: colors.textSecondary }]}>No evening supplements</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        ) : (
          // List View
          <View style={styles.listContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Supplements</Text>
            
            {supplements.map(supplement => (
              <TouchableOpacity
                key={supplement.id}
                style={[styles.supplementListItem, { 
                  backgroundColor: colors.cardBg,
                  borderColor: colors.border,
                  shadowColor: colors.text 
                }]}
                onPress={() => openSupplementDetail(supplement)}
              >
                <View style={styles.supplementInfo}>
                  <Image source={{ uri: supplement.image }} style={styles.supplementImage} />
                  <View style={styles.supplementDetails}>
                    <Text style={[styles.supplementName, { color: colors.text }]}>{supplement.name}</Text>
                    <Text style={[styles.supplementDosage, { color: colors.textSecondary }]}>{supplement.dosage}</Text>
                    <Text style={[styles.supplementTime, { color: colors.textSecondary }]}>
                      {supplement.schedule.includes('morning') ? 'Morning' : ''}
                      {supplement.schedule.includes('morning') && supplement.schedule.includes('evening') ? ' & ' : ''}
                      {supplement.schedule.includes('evening') ? 'Evening' : ''}
                    </Text>
                  </View>
                </View>
                
                <TouchableOpacity 
                  style={styles.listCheckButton}
                  onPress={() => toggleSupplementTaken(supplement.id)}
                >
                  <Ionicons
                    name={supplement.takenToday ? "checkmark-circle" : "checkmark-circle-outline"}
                    size={28}
                    color={supplement.takenToday ? colors.success : colors.border}
                  />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}
        
        {/* Add Button */}
        <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.primary }]}>
          <Ionicons name="add" size={30} color={colors.secondary} />
          <Text style={[styles.addButtonText, { color: colors.secondary }]}>Add Supplement</Text>
        </TouchableOpacity>
      </ScrollView>
      
      {/* Supplement Detail Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBg }]}>
            {selectedSupplement && (
              <>
                <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>{selectedSupplement.name}</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Ionicons name="close" size={24} color={colors.text} />
                  </TouchableOpacity>
                </View>
                
                <ScrollView style={styles.modalBody}>
                  <View style={[styles.supplementBanner, { backgroundColor: selectedSupplement.color }]}>
                    <Image source={{ uri: selectedSupplement.image }} style={styles.modalImage} />
                    <View style={styles.bannerContent}>
                      <Text style={styles.bannerText}>{selectedSupplement.category}</Text>
                      <Text style={styles.bannerDosage}>{selectedSupplement.dosage}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.modalSection}>
                    <Text style={[styles.modalSectionTitle, { color: colors.text }]}>Description</Text>
                    <Text style={[styles.modalDescription, { color: colors.text }]}>
                      {selectedSupplement.description}
                    </Text>
                  </View>
                  
                  <View style={styles.modalSection}>
                    <Text style={[styles.modalSectionTitle, { color: colors.text }]}>Schedule</Text>
                    <View style={styles.scheduleRow}>
                      {selectedSupplement.schedule.includes('morning') && (
                        <View style={[styles.scheduleTag, { backgroundColor: colors.inputBg }]}>
                          <Ionicons name="sunny-outline" size={16} color={colors.primary} />
                          <Text style={[styles.scheduleText, { color: colors.text }]}>Morning</Text>
                        </View>
                      )}
                      {selectedSupplement.schedule.includes('evening') && (
                        <View style={[styles.scheduleTag, { backgroundColor: colors.inputBg }]}>
                          <Ionicons name="moon-outline" size={16} color={colors.primary} />
                          <Text style={[styles.scheduleText, { color: colors.text }]}>Evening</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  
                  <View style={styles.modalSection}>
                    <Text style={[styles.modalSectionTitle, { color: colors.text }]}>Status</Text>
                    <View style={styles.statusRow}>
                      <View style={styles.statusItem}>
                        <Text style={[styles.statusValue, { color: colors.text }]}>{selectedSupplement.timesTaken}</Text>
                        <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>Times Taken</Text>
                      </View>
                      <View style={styles.statusItem}>
                        <Text style={[styles.statusValue, { color: colors.text }]}>{selectedSupplement.streak}</Text>
                        <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>Day Streak</Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.modalSection}>
                    <View style={styles.reminderRow}>
                      <View style={styles.reminderTitleContainer}>
                        <Text style={[styles.modalSectionTitle, { color: colors.text }]}>Reminders</Text>
                        <Text style={[styles.reminderTime, { color: colors.textSecondary }]}>
                          {selectedSupplement.reminder ? selectedSupplement.reminderTime : 'Off'}
                        </Text>
                      </View>
                      <Switch
                        value={selectedSupplement.reminder}
                        onValueChange={() => {
                          // In a real app, would toggle reminder settings
                        }}
                        trackColor={{ false: colors.border, true: colors.primary + '80' }}
                        thumbColor={selectedSupplement.reminder ? colors.primary : colors.textSecondary}
                      />
                    </View>
                  </View>
                </ScrollView>
                
                <View style={[styles.modalActions, { borderTopColor: colors.border }]}>
                  <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: selectedSupplement.takenToday ? colors.success : colors.primary }]}
                    onPress={() => {
                      toggleSupplementTaken(selectedSupplement.id);
                      setModalVisible(false);
                    }}
                  >
                    {selectedSupplement.takenToday ? (
                      <Text style={[styles.actionButtonText, { color: colors.secondary }]}>Mark as Not Taken</Text>
                    ) : (
                      <Text style={[styles.actionButtonText, { color: colors.secondary }]}>Mark as Taken</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  timeLabel: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  calendarCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  calendarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  calendarDay: {
    alignItems: 'center',
  },
  selectedDay: {
    transform: [{ scale: 1.1 }],
  },
  dayName: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.border,
  },
  dayComplete: {
    backgroundColor: COLORS.success,
  },
  dayPartial: {
    backgroundColor: COLORS.primary,
  },
  dayIncomplete: {
    backgroundColor: COLORS.border,
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.secondary,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 5,
  },
  legendText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  completionCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  completionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  completionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  completionCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completionPercentage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.secondary,
  },
  progressBarContainer: {
    height: 10,
    backgroundColor: COLORS.border,
    borderRadius: 5,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 5,
  },
  completionText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  viewToggleContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
  },
  viewToggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  viewToggleActive: {
    backgroundColor: 'rgba(247, 178, 51, 0.15)',
  },
  viewToggleText: {
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  viewToggleTextActive: {
    color: COLORS.primary,
    fontWeight: '500',
  },
  visualStackContainer: {
    marginBottom: 20,
  },
  stackWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeStackContainer: {
    width: '48%',
  },
  stackTimeLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  visualStack: {
    alignItems: 'center',
    paddingTop: 8,
  },
  stackItem: {
    width: '100%',
    height: 100,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stackItemContent: {
    flex: 1,
  },
  stackItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.secondary,
    marginBottom: 4,
  },
  stackItemDosage: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  checkButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedButton: {
    opacity: 1,
  },
  emptyStack: {
    width: '100%',
    height: 100,
    borderRadius: 12,
    backgroundColor: COLORS.inputBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStackText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  listContainer: {
    marginBottom: 20,
  },
  supplementListItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBg,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  supplementInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  supplementImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 16,
  },
  supplementDetails: {
    flex: 1,
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
    marginBottom: 4,
  },
  supplementTime: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  listCheckButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listCheckedButton: {
    opacity: 1,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginTop: 8,
  },
  addButtonText: {
    color: COLORS.secondary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.cardBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  modalBody: {
    marginBottom: 24,
  },
  modalImage: {
    width: '100%',
    height: 150,
    borderRadius: 12,
    marginBottom: 20,
  },
  modalDetailRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  modalLabel: {
    width: 100,
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  modalValue: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '500',
  },
  modalDescription: {
    fontSize: 15,
    color: COLORS.text,
    marginBottom: 20,
    lineHeight: 22,
  },
  reminderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  reminderText: {
    fontSize: 15,
    color: COLORS.text,
  },
  reminderTimeContainer: {
    backgroundColor: COLORS.inputBg,
    padding: 12,
    borderRadius: 12,
  },
  reminderTimeText: {
    fontSize: 14,
    color: COLORS.text,
  },
  modalActions: {
    marginTop: 12,
  },
  actionButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  takeButton: {
    backgroundColor: COLORS.success,
  },
  untakeButton: {
    backgroundColor: COLORS.error,
  },
  actionButtonText: {
    color: COLORS.secondary,
    fontSize: 16,
    fontWeight: '600',
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
export default withAuth(TrackScreen); 