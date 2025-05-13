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
  FlatList,
  Dimensions,
  ActivityIndicator,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
}

// Mock data for supplement recommendations
const mockRecommendations = [
  { 
    id: 1, 
    name: 'Vitamin D3', 
    category: 'Essential Vitamin',
    match: 95,
    benefits: ['Immune support', 'Bone health', 'Mood regulation'],
    description: 'Vitamin D3 is essential for calcium absorption and bone health. It also plays a crucial role in immune function and mood regulation.',
    dosage: '1000-5000 IU daily',
    image: 'https://images.unsplash.com/photo-1584362917165-526a968579e8?q=80&w=200&auto=format',
    tags: ['immunity', 'bone health', 'mood'],
    reasons: [
      'Your blood work shows Vitamin D levels below optimal range',
      'You reported spending limited time outdoors',
      'Your health goals include immune support'
    ]
  },
  { 
    id: 2, 
    name: 'Omega-3 Fish Oil', 
    category: 'Essential Fatty Acid',
    match: 90,
    benefits: ['Heart health', 'Brain function', 'Anti-inflammatory'],
    description: 'Omega-3 fatty acids are important for heart and brain health. They have anti-inflammatory properties and may help reduce the risk of chronic diseases.',
    dosage: '1000-2000 mg daily',
    image: 'https://images.unsplash.com/photo-1584363539225-4d0420e52b5e?q=80&w=200&auto=format',
    tags: ['heart health', 'brain health', 'inflammation'],
    reasons: [
      'Your diet profile indicates low omega-3 intake',
      'You reported joint discomfort',
      'Your health goals include heart health'
    ]
  },
  { 
    id: 3, 
    name: 'Magnesium Glycinate', 
    category: 'Essential Mineral',
    match: 88,
    benefits: ['Sleep support', 'Muscle recovery', 'Stress reduction'],
    description: 'Magnesium is involved in over 300 biochemical reactions in the body. It supports muscle and nerve function, energy production, and helps regulate sleep.',
    dosage: '300-400 mg daily',
    image: 'https://images.unsplash.com/photo-1584363545591-43ffe646b655?q=80&w=200&auto=format',
    tags: ['sleep', 'stress', 'muscle recovery'],
    reasons: [
      'Your sleep quality assessment shows room for improvement',
      'You reported muscle soreness after workouts',
      'Your health goals include stress management'
    ]
  },
  { 
    id: 4, 
    name: 'Ashwagandha', 
    category: 'Adaptogen',
    match: 85,
    benefits: ['Stress reduction', 'Energy', 'Hormone balance'],
    description: 'Ashwagandha is an adaptogenic herb that may help the body manage stress. It has been shown to reduce cortisol levels and support overall wellbeing.',
    dosage: '300-600 mg daily',
    image: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?q=80&w=200&auto=format',
    tags: ['stress', 'energy', 'hormones'],
    reasons: [
      'Your stress assessment indicates elevated stress levels',
      'You reported feeling fatigued throughout the day',
      'Your health goals include natural energy support'
    ]
  },
  { 
    id: 5, 
    name: 'Zinc', 
    category: 'Essential Mineral',
    match: 82,
    benefits: ['Immune support', 'Skin health', 'Testosterone support'],
    description: 'Zinc is essential for immune function, protein synthesis, and wound healing. It also plays a role in DNA synthesis and cell division.',
    dosage: '15-30 mg daily',
    image: 'https://images.unsplash.com/photo-1584386453939-c7e7a0092f7a?q=80&w=200&auto=format',
    tags: ['immunity', 'skin health', 'hormone support'],
    reasons: [
      'Your seasonal preferences indicate increased need for immune support',
      'You reported skin concerns',
      'Your health goals include overall wellness'
    ]
  },
  { 
    id: 6, 
    name: 'Vitamin B Complex', 
    category: 'Essential Vitamins',
    match: 80,
    benefits: ['Energy production', 'Brain function', 'Metabolism'],
    description: 'B vitamins are essential for energy production, brain function, and cell metabolism. They help convert food into energy and are vital for nervous system function.',
    dosage: 'As directed on label',
    image: 'https://images.unsplash.com/photo-1584386450595-138b1d26a3a3?q=80&w=200&auto=format',
    tags: ['energy', 'brain health', 'metabolism'],
    reasons: [
      'Your diet assessment shows potential gaps in B vitamin intake',
      'You reported afternoon energy slumps',
      'Your health goals include cognitive performance'
    ]
  },
  { 
    id: 7, 
    name: 'Turmeric/Curcumin', 
    category: 'Anti-inflammatory',
    match: 78,
    benefits: ['Joint health', 'Anti-inflammatory', 'Antioxidant'],
    description: 'Curcumin, the active compound in turmeric, has powerful anti-inflammatory and antioxidant properties. It may help reduce inflammation and support joint health.',
    dosage: '500-1000 mg daily (with black pepper extract)',
    image: 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?q=80&w=200&auto=format',
    tags: ['inflammation', 'joint health', 'antioxidant'],
    reasons: [
      'You reported joint discomfort after physical activity',
      'Your health goals include reducing inflammation',
      'Your activity profile indicates high-impact exercise'
    ]
  },
  { 
    id: 8, 
    name: 'Probiotics', 
    category: 'Gut Health',
    match: 75,
    benefits: ['Digestive health', 'Immune support', 'Gut-brain connection'],
    description: 'Probiotics are beneficial bacteria that support gut health. They help maintain a healthy balance of gut flora, which is important for digestion and immune function.',
    dosage: '1-10 billion CFU daily',
    image: 'https://images.unsplash.com/photo-1573605591580-3fd1bb17dee8?q=80&w=200&auto=format',
    tags: ['gut health', 'immunity', 'digestion'],
    reasons: [
      'Your digestive comfort assessment indicates room for improvement',
      'You reported occasional digestive discomfort',
      'Your health goals include overall wellness'
    ]
  },
];

// Filter categories
const filterCategories = [
  { id: 'all', name: 'All' },
  { id: 'essential', name: 'Essential' },
  { id: 'immunity', name: 'Immunity' },
  { id: 'energy', name: 'Energy' },
  { id: 'sleep', name: 'Sleep' },
  { id: 'stress', name: 'Stress' },
  { id: 'joint', name: 'Joint Health' },
];

function RecommendScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState([]);
  const [filteredRecommendations, setFilteredRecommendations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSupplement, setSelectedSupplement] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const screenWidth = Dimensions.get('window').width;
  
  // Load recommendation data
  useEffect(() => {
    const loadRecommendData = async () => {
      try {
        // In a real app, these would be API calls
        await new Promise(resolve => setTimeout(resolve, 800));
        setRecommendations(mockRecommendations);
        setFilteredRecommendations(mockRecommendations);
      } catch (error) {
        console.error('Error loading recommendation data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRecommendData();
  }, []);

  // Filter recommendations based on search and category
  useEffect(() => {
    let filtered = recommendations;
    
    // Filter by search query
    if (searchQuery) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(lowerCaseQuery) || 
        item.category.toLowerCase().includes(lowerCaseQuery) ||
        item.tags.some(tag => tag.toLowerCase().includes(lowerCaseQuery))
      );
    }
    
    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => {
        switch(selectedCategory) {
          case 'essential':
            return item.category.includes('Essential');
          case 'immunity':
            return item.tags.includes('immunity');
          case 'energy':
            return item.tags.includes('energy');
          case 'sleep':
            return item.tags.includes('sleep');
          case 'stress':
            return item.tags.includes('stress');
          case 'joint':
            return item.tags.includes('joint health');
          default:
            return true;
        }
      });
    }
    
    setFilteredRecommendations(filtered);
  }, [searchQuery, selectedCategory, recommendations]);

  // View supplement details
  const openSupplementDetail = (supplement) => {
    setSelectedSupplement(supplement);
    setModalVisible(true);
  };

  // Render match indicator based on percentage
  const renderMatchIndicator = (percentage) => {
    let color = COLORS.error;
    if (percentage >= 90) color = COLORS.success;
    else if (percentage >= 75) color = COLORS.primary;
    
    return (
      <View style={styles.matchContainer}>
        <Text style={[styles.matchText, {color}]}>{percentage}% match</Text>
        <View style={styles.matchBarContainer}>
          <View style={[styles.matchBar, {width: `${percentage}%`, backgroundColor: color}]} />
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading recommendations...</Text>
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
          <Text style={styles.title}>Recommended For You</Text>
        </View>
        
        {/* Personalized Message */}
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeText}>
            Hi {user?.name || 'there'}! Here are your personalized supplement recommendations based on your health profile.
          </Text>
        </View>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search supplements..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={COLORS.textSecondary}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>
        
        {/* Category Filter */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesContent}
        >
          {filterCategories.map(category => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryButton,
                selectedCategory === category.id && styles.categoryButtonActive
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Text
                style={[
                  styles.categoryButtonText,
                  selectedCategory === category.id && styles.categoryButtonTextActive
                ]}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        {/* Results Count */}
        <Text style={styles.resultsText}>
          {filteredRecommendations.length} {filteredRecommendations.length === 1 ? 'supplement' : 'supplements'} found
        </Text>
        
        {/* Recommendations List */}
        {filteredRecommendations.length > 0 ? (
          filteredRecommendations.map(recommendation => (
            <TouchableOpacity
              key={recommendation.id}
              style={styles.recommendationCard}
              onPress={() => openSupplementDetail(recommendation)}
            >
              <Image source={{ uri: recommendation.image }} style={styles.recommendationImage} />
              <View style={styles.recommendationContent}>
                <Text style={styles.recommendationName}>{recommendation.name}</Text>
                <Text style={styles.recommendationCategory}>{recommendation.category}</Text>
                
                <View style={styles.benefitsContainer}>
                  {recommendation.benefits.slice(0, 3).map((benefit, index) => (
                    <View key={index} style={styles.benefitTag}>
                      <Text style={styles.benefitText}>{benefit}</Text>
                    </View>
                  ))}
                </View>
                
                {renderMatchIndicator(recommendation.match)}
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.noResultsContainer}>
            <Ionicons name="search" size={60} color={COLORS.border} />
            <Text style={styles.noResultsText}>No supplements found</Text>
            <Text style={styles.noResultsSubtext}>Try adjusting your search or filters</Text>
          </View>
        )}
      </ScrollView>
      
      {/* Supplement Detail Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedSupplement && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedSupplement.name}</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Ionicons name="close" size={24} color={COLORS.text} />
                  </TouchableOpacity>
                </View>
                
                <ScrollView style={styles.modalBody}>
                  <Image source={{ uri: selectedSupplement.image }} style={styles.modalImage} />
                  
                  {/* Match bar in modal */}
                  <View style={styles.modalMatchContainer}>
                    <Text style={styles.modalMatchLabel}>Match for your profile:</Text>
                    <Text style={styles.modalMatchPercentage}>{selectedSupplement.match}%</Text>
                    <View style={styles.modalMatchBarContainer}>
                      <View 
                        style={[
                          styles.modalMatchBar, 
                          {width: `${selectedSupplement.match}%`}
                        ]} 
                      />
                    </View>
                  </View>
                  
                  {/* Description */}
                  <Text style={styles.sectionTitle}>Description</Text>
                  <Text style={styles.modalDescription}>{selectedSupplement.description}</Text>
                  
                  {/* Benefits */}
                  <Text style={styles.sectionTitle}>Benefits</Text>
                  <View style={styles.modalBenefitsContainer}>
                    {selectedSupplement.benefits.map((benefit, index) => (
                      <View key={index} style={styles.modalBenefitItem}>
                        <Ionicons name="checkmark-circle" size={18} color={COLORS.success} style={styles.benefitIcon} />
                        <Text style={styles.modalBenefitText}>{benefit}</Text>
                      </View>
                    ))}
                  </View>
                  
                  {/* Recommended Dosage */}
                  <Text style={styles.sectionTitle}>Recommended Dosage</Text>
                  <View style={styles.dosageContainer}>
                    <Ionicons name="flask-outline" size={20} color={COLORS.primary} style={styles.dosageIcon} />
                    <Text style={styles.dosageText}>{selectedSupplement.dosage}</Text>
                  </View>
                  
                  {/* Why it's recommended */}
                  <Text style={styles.sectionTitle}>Why It's Recommended For You</Text>
                  <View style={styles.reasonsContainer}>
                    {selectedSupplement.reasons.map((reason, index) => (
                      <View key={index} style={styles.reasonItem}>
                        <Text style={styles.reasonNumber}>{index + 1}</Text>
                        <Text style={styles.reasonText}>{reason}</Text>
                      </View>
                    ))}
                  </View>
                </ScrollView>
                
                <View style={styles.modalActions}>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => {
                      setModalVisible(false);
                      // In a real app, navigate to track page or add to supplement routine
                      router.push('/track');
                    }}
                  >
                    <Text style={styles.actionButtonText}>Add to My Supplements</Text>
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
  welcomeContainer: {
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    height: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: COLORS.text,
  },
  categoriesContainer: {
    marginBottom: 16,
  },
  categoriesContent: {
    paddingRight: 20,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: COLORS.inputBg,
  },
  categoryButtonActive: {
    backgroundColor: COLORS.primary,
  },
  categoryButtonText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  categoryButtonTextActive: {
    color: COLORS.secondary,
  },
  resultsText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  recommendationCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    flexDirection: 'row',
  },
  recommendationImage: {
    width: 100,
    height: 'auto',
    aspectRatio: 1,
  },
  recommendationContent: {
    flex: 1,
    padding: 16,
  },
  recommendationName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  recommendationCategory: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  benefitsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  benefitTag: {
    backgroundColor: COLORS.inputBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 6,
    marginBottom: 6,
  },
  benefitText: {
    fontSize: 12,
    color: COLORS.text,
  },
  matchContainer: {
    marginTop: 'auto',
  },
  matchText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  matchBarContainer: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  matchBar: {
    height: '100%',
    borderRadius: 2,
  },
  noResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
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
    maxHeight: '90%',
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
    marginBottom: 20,
  },
  modalImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 20,
  },
  modalMatchContainer: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  modalMatchLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  modalMatchPercentage: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.success,
    marginBottom: 8,
  },
  modalMatchBarContainer: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  modalMatchBar: {
    height: '100%',
    backgroundColor: COLORS.success,
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  modalDescription: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
    marginBottom: 20,
  },
  modalBenefitsContainer: {
    marginBottom: 20,
  },
  modalBenefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  benefitIcon: {
    marginRight: 8,
  },
  modalBenefitText: {
    fontSize: 15,
    color: COLORS.text,
  },
  dosageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  dosageIcon: {
    marginRight: 12,
  },
  dosageText: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '500',
  },
  reasonsContainer: {
    marginBottom: 20,
  },
  reasonItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  reasonNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    color: COLORS.secondary,
    textAlign: 'center',
    fontWeight: 'bold',
    marginRight: 12,
    lineHeight: 24,
  },
  reasonText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
  },
  modalActions: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 16,
  },
  actionButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: COLORS.secondary,
    fontSize: 16,
    fontWeight: '600',
  },
});

// Wrap the component with the auth HOC
export default withAuth(RecommendScreen); 