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
import { useTheme } from '../services/themeContext';
import { getThemedStyles, getTextStyle } from '../services/themeHelper';

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

// Mock data for educational content
const mockArticles = [
  {
    id: 1,
    title: 'Understanding Vitamin D: The Sunshine Vitamin',
    category: 'Vitamin',
    readTime: 5,
    image: 'https://images.unsplash.com/photo-1584362917165-526a968579e8?q=80&w=300&auto=format',
    summary: 'Learn about the importance of Vitamin D, how it affects your health, and how to ensure you are getting enough.',
    content: `Vitamin D is often called the "sunshine vitamin" because your body produces it when exposed to sunlight. It's essential for bone health, immune function, and more.

### Why Vitamin D Matters

Vitamin D plays several critical roles in the body:
- Promotes calcium absorption for bone health
- Supports immune system function
- May help regulate mood and reduce depression
- Plays a role in muscle function and development

### Are You Getting Enough?

Many people are deficient in vitamin D, especially those who:
- Live in northern climates with less sunlight
- Have darker skin (which reduces vitamin D production)
- Stay indoors most of the time
- Are over 65 years old
- Have certain medical conditions

### Sources of Vitamin D

1. **Sunlight**: 10-30 minutes of midday sun exposure several times per week
2. **Foods**: Fatty fish, egg yolks, fortified milk, cheese, and mushrooms
3. **Supplements**: Vitamin D3 (cholecalciferol) is the preferred form

### Recommended Dosage

- Adults: 600-2000 IU daily
- Seniors (65+): 800-2000 IU daily
- Those with deficiency: May need higher doses under medical supervision

### Bottom Line

Vitamin D is crucial for overall health, and many people don't get enough. Consider testing your levels and supplementing if necessary, especially during winter months.`,
    tags: ['vitamin d', 'immunity', 'bone health', 'sunshine vitamin'],
    date: '2023-09-15',
    author: 'Dr. Sarah Chen',
    authorTitle: 'Nutritional Biochemist'
  },
  {
    id: 2,
    title: 'Omega-3 Fatty Acids: Essential for Brain and Heart Health',
    category: 'Nutrient',
    readTime: 7,
    image: 'https://images.unsplash.com/photo-1584363539225-4d0420e52b5e?q=80&w=300&auto=format',
    summary: 'Discover why omega-3s are critical for your health and how to incorporate more into your diet.',
    content: `Omega-3 fatty acids are essential fats that your body cannot produce on its own. They're crucial for brain function, heart health, and reducing inflammation.

### Types of Omega-3s

There are three main types of omega-3 fatty acids:
- **EPA (Eicosapentaenoic Acid)**: Found primarily in fatty fish, good for heart health
- **DHA (Docosahexaenoic Acid)**: Critical for brain health, also found in fatty fish
- **ALA (Alpha-linolenic Acid)**: Found in plant sources like flaxseed and walnuts

### Benefits of Omega-3s

- **Brain Health**: Supports cognitive function and may help prevent cognitive decline
- **Heart Health**: Reduces inflammation, lowers triglycerides, and improves cholesterol profiles
- **Inflammation**: Helps reduce chronic inflammation throughout the body
- **Mood**: May help reduce symptoms of depression and anxiety
- **Eye Health**: DHA is a major structural component of the retina

### Best Food Sources

1. **Fatty Fish**: Salmon, mackerel, sardines, herring, and anchovies
2. **Plant Sources**: Flaxseeds, chia seeds, hemp seeds, and walnuts
3. **Fortified Foods**: Some eggs, yogurt, and juices are fortified with omega-3s

### Supplement Options

If you don't consume enough omega-3s through your diet, supplements can help:
- Fish oil capsules (look for ones that specify EPA and DHA content)
- Algae oil (a plant-based option for vegetarians/vegans)
- Krill oil (may be better absorbed than standard fish oil)

### Recommended Intake

- General recommendation: 250-500mg combined EPA and DHA daily
- For heart health benefits: 1,000-2,000mg daily
- ALA: 1.1g for women and 1.6g for men daily

### Tips for Quality

When choosing omega-3 supplements:
- Look for third-party testing
- Check for molecular distillation or proper purification
- Store in cool, dark places to prevent oxidation`,
    tags: ['omega-3', 'fatty acids', 'brain health', 'heart health'],
    date: '2023-10-05',
    author: 'Dr. Michael Torres',
    authorTitle: 'Cardiologist & Nutrition Specialist'
  },
  {
    id: 3,
    title: 'The Science of Sleep: How Supplements Can Help',
    category: 'Sleep',
    readTime: 8,
    image: 'https://images.unsplash.com/photo-1584988174832-981cd63b53d0?q=80&w=300&auto=format',
    summary: 'Explore the science behind sleep supplements and which ones are backed by research.',
    content: `Quality sleep is essential for physical health, cognitive function, and emotional wellbeing. For those struggling with sleep, certain supplements may help improve both sleep quality and quantity.

### Understanding Sleep Cycles

Sleep consists of several cycles, each containing different stages:
- **Non-REM Sleep**: Includes light sleep (N1 and N2) and deep sleep (N3)
- **REM Sleep**: When most dreaming occurs and memory consolidation happens

Good sleep supplements support these natural cycles rather than simply inducing unconsciousness.

### Evidence-Based Sleep Supplements

#### Melatonin
- **What it is**: A hormone naturally produced by your pineal gland
- **Benefits**: Helps regulate sleep-wake cycles, particularly useful for jet lag and shift work
- **Dosage**: 0.5-5mg, taken 30-60 minutes before bedtime
- **Cautions**: May cause vivid dreams or morning grogginess in some people

#### Magnesium
- **What it is**: An essential mineral that many people are deficient in
- **Benefits**: Helps relax muscles and calm the nervous system
- **Dosage**: 200-400mg, preferably as magnesium glycinate or threonate
- **Cautions**: May cause digestive issues in high doses

#### L-Theanine
- **What it is**: An amino acid found primarily in tea leaves
- **Benefits**: Promotes relaxation without drowsiness; pairs well with GABA
- **Dosage**: 200-400mg before bed
- **Cautions**: Generally well-tolerated

#### Glycine
- **What it is**: A non-essential amino acid
- **Benefits**: May improve sleep quality and reduce daytime sleepiness
- **Dosage**: 3g before bedtime
- **Cautions**: Few side effects reported

### Herbal Sleep Aids

- **Valerian Root**: May improve sleep quality but research is mixed
- **Ashwagandha**: An adaptogen that helps reduce stress and anxiety
- **Chamomile**: Mild sedative properties, often consumed as tea
- **Lemon Balm**: May reduce anxiety and improve sleep quality

### Sleep Hygiene: The Foundation

Supplements work best when combined with good sleep practices:
- Maintain a consistent sleep schedule
- Create a dark, cool sleeping environment
- Limit screen time before bed
- Avoid caffeine after mid-afternoon
- Exercise regularly (but not right before bed)
- Limit alcohol, which disrupts sleep cycles

### When to Seek Help

If you experience chronic insomnia or sleep disturbances, consult a healthcare provider before relying solely on supplements. Sleep disorders may require medical intervention.`,
    tags: ['sleep', 'insomnia', 'melatonin', 'magnesium'],
    date: '2023-11-12',
    author: 'Dr. Lisa Johnson',
    authorTitle: 'Sleep Researcher & Neuroscientist'
  },
  {
    id: 4,
    title: 'Adaptogens: Ancient Herbs for Modern Stress',
    category: 'Herbs',
    readTime: 6,
    image: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?q=80&w=300&auto=format',
    summary: 'Learn how adaptogenic herbs can help your body manage stress and improve resilience.',
    content: `Adaptogens are a class of herbs and mushrooms that help your body resist stressors of all kinds, whether physical, chemical or biological. These remarkable plants have been used in Chinese and Ayurvedic healing traditions for centuries.

### What Makes an Herb Adaptogenic?

For an herb to be considered adaptogenic, it must:
1. Be non-specific (help the body resist a wide range of adverse conditions)
2. Have a normalizing effect (help return the body to balance regardless of the direction of change)
3. Be non-toxic when used in appropriate doses

### Top Researched Adaptogens

#### Ashwagandha
- **Benefits**: Reduces cortisol, supports thyroid function, may improve sleep
- **Research**: Multiple studies show significant reduction in stress and anxiety scores
- **Dosage**: 300-600mg daily of root extract
- **Best for**: Stress reduction, anxiety, sleep support

#### Rhodiola Rosea
- **Benefits**: Fights fatigue, improves mental performance, enhances physical stamina
- **Research**: Shown to reduce burnout and improve attention in multiple trials
- **Dosage**: 200-600mg daily (standardized to 3% rosavins and 1% salidroside)
- **Best for**: Mental fatigue, focus, athletic performance

#### Holy Basil (Tulsi)
- **Benefits**: Reduces stress, supports immune function, balances blood sugar
- **Research**: Clinical trials support its anti-stress and cognitive-enhancing effects
- **Dosage**: 300-2,000mg daily of leaf extract
- **Best for**: Stress, inflammation, immune support

#### Eleuthero (Siberian Ginseng)
- **Benefits**: Enhances energy, improves mental performance, supports immune function
- **Research**: Studies show improved endurance and stress resistance
- **Dosage**: 400-1,200mg daily of root extract
- **Best for**: Physical performance, immune support

### How Adaptogens Work

Adaptogens work primarily by interacting with the hypothalamic-pituitary-adrenal (HPA) axis and the sympathoadrenal system, both of which are involved in the body's response to stress. They help:

- Regulate key mediators of the stress response
- Support cellular energy metabolism
- Reduce oxidative stress
- Maintain hormonal balance

### Incorporating Adaptogens

- **Start Low**: Begin with one adaptogen at a lower dose
- **Be Consistent**: Most adaptogens work best when taken regularly (2-3 months minimum)
- **Cycle Usage**: Some practitioners recommend cycling adaptogens (e.g., 6 weeks on, 2 weeks off)
- **Quality Matters**: Look for standardized extracts from reputable sources

### Precautions

While generally safe, adaptogens may interact with certain medications and aren't recommended for pregnant or breastfeeding women without medical supervision. Those with autoimmune conditions should consult healthcare providers before use.`,
    tags: ['adaptogen', 'stress', 'ashwagandha', 'herbs'],
    date: '2023-12-03',
    author: 'Dr. David Wilson',
    authorTitle: 'Herbalist & Integrative Medicine Practitioner'
  },
  {
    id: 5,
    title: 'Probiotics and Gut Health: The Second Brain Connection',
    category: 'Gut Health',
    readTime: 9,
    image: 'https://images.unsplash.com/photo-1573605591580-3fd1bb17dee8?q=80&w=300&auto=format',
    summary: 'Discover how your gut microbiome influences your health and how probiotics can help.',
    content: `The human gut contains trillions of microorganisms collectively known as the gut microbiome. This complex ecosystem plays a crucial role not just in digestion, but in immune function, mental health, and overall wellbeing.

### The Gut-Brain Connection

Your gut contains more than 500 million neurons, connected to your brain through the vagus nerve. This communication network is often called the "gut-brain axis," and it explains why:

- Stress can trigger digestive issues
- Gut problems can contribute to anxiety and depression
- Certain probiotics may influence mood and cognitive function

### Understanding Probiotics

Probiotics are live beneficial bacteria similar to those naturally found in your gut. They can:

- Help balance the gut microbiome
- Support digestive function
- Strengthen the gut barrier
- Modulate immune responses
- Potentially influence brain function through the gut-brain axis

### Key Probiotic Strains and Their Benefits

#### Lactobacillus Family
- **L. acidophilus**: Supports digestive health and immune function
- **L. rhamnosus GG**: Well-researched for immune support and preventing diarrhea
- **L. plantarum**: May help with IBS symptoms and strengthen gut barrier

#### Bifidobacterium Family
- **B. longum**: Helps break down carbohydrates and may support brain health
- **B. bifidum**: Supports immune system function and helps maintain gut barrier
- **B. lactis**: May improve digestive symptoms and enhance immunity

#### Specialized Strains
- **Saccharomyces boulardii**: A beneficial yeast that helps with diarrhea and gut inflammation
- **Bacillus coagulans**: Spore-forming bacteria with excellent survivability

### Choosing a Probiotic Supplement

Look for these factors when selecting a probiotic:
- **Strain specificity**: Match strains to your health goals
- **CFU count**: Usually 1-50 billion CFUs (colony forming units)
- **Survivability**: Can the probiotics survive stomach acid?
- **Quality control**: Third-party testing for potency and purity
- **Storage requirements**: Some require refrigeration

### Beyond Supplements: Probiotic Foods

Fermented foods are natural sources of probiotics:
- Yogurt with live cultures
- Kefir (dairy or water-based)
- Sauerkraut (unpasteurized)
- Kimchi
- Kombucha
- Tempeh
- Miso

### Prebiotics: Feeding Your Gut Bacteria

Prebiotics are non-digestible food components that feed beneficial bacteria. Good sources include:
- Garlic, onions, and leeks
- Bananas, apples, and berries
- Jerusalem artichokes
- Asparagus
- Oats
- Flaxseeds
- Chicory root

### When to Take Probiotics

For general health: 
- Consistency is key
- Some strains are better taken with meals, others on an empty stomach
- Follow supplement-specific recommendations

After antibiotics:
- Start within 48 hours of beginning antibiotics
- Take at least 2 hours apart from antibiotic doses
- Continue for at least 2 weeks after completing antibiotics`,
    tags: ['probiotics', 'gut health', 'microbiome', 'digestion'],
    date: '2024-01-08',
    author: 'Dr. Emma Rodriguez',
    authorTitle: 'Gastroenterologist & Microbiome Researcher'
  },
  {
    id: 6,
    title: 'Magnesium: The Mighty Mineral You Might Be Missing',
    category: 'Mineral',
    readTime: 6,
    image: 'https://images.unsplash.com/photo-1584363545591-43ffe646b655?q=80&w=300&auto=format',
    summary: 'Explore the many roles of magnesium in your body and signs you might need more.',
    content: `Magnesium is involved in over 300 enzymatic reactions in the body, yet an estimated 50% of Americans don't get enough. This crucial mineral affects everything from energy production to sleep quality.

### Essential Functions of Magnesium

- **Energy Production**: Helps convert food into energy
- **Muscle Function**: Regulates muscle contractions and prevents cramping
- **Nervous System**: Helps regulate neurotransmitters that promote calm
- **Bone Health**: About 60% of your body's magnesium is stored in bones
- **DNA Synthesis**: Required for creating and repairing DNA
- **Blood Sugar Control**: Helps regulate insulin sensitivity
- **Blood Pressure Regulation**: Helps relax blood vessels

### Signs of Magnesium Deficiency

- Muscle cramps and twitches
- Fatigue and low energy
- Anxiety and irritability
- Insomnia and poor sleep
- Headaches or migraines
- Irregular heartbeat
- PMS symptoms
- Bone health concerns

### Types of Magnesium Supplements

Different forms of magnesium have different benefits:

#### Magnesium Glycinate
- **Benefits**: Highly absorbable, minimal digestive effects
- **Best for**: Sleep, anxiety, muscle relaxation
- **Dosage**: 200-400mg daily

#### Magnesium Citrate
- **Benefits**: Good bioavailability, mild laxative effect
- **Best for**: Constipation, general supplementation
- **Dosage**: 200-400mg daily

#### Magnesium Malate
- **Benefits**: Gentle, may help with energy production
- **Best for**: Fatigue, exercise recovery
- **Dosage**: 200-400mg daily

#### Magnesium Threonate
- **Benefits**: Can cross the blood-brain barrier
- **Best for**: Cognitive function, brain health
- **Dosage**: 1,000-2,000mg daily (providing ~140mg elemental magnesium)

#### Magnesium Oxide
- **Benefits**: Inexpensive, high elemental magnesium content
- **Best for**: Quick relief of constipation, heartburn
- **Dosage**: 400-600mg daily
- **Note**: Poor absorption, stronger laxative effect

### Food Sources of Magnesium

- Dark leafy greens (spinach, kale)
- Nuts and seeds (especially pumpkin seeds and almonds)
- Legumes (beans, lentils)
- Whole grains
- Dark chocolate (70%+ cacao)
- Avocados
- Bananas

### Optimizing Magnesium Absorption

- **Vitamin D**: Adequate vitamin D improves magnesium absorption
- **Balanced Calcium**: Excessive calcium can compete with magnesium
- **Reduce Phosphates**: Limit sodas and processed foods
- **Gut Health**: Healthy digestion improves mineral absorption
- **Timing**: Some forms are better absorbed on an empty stomach

### Precautions

- Start with lower doses and increase gradually
- Watch for digestive effects, especially with citrate and oxide forms
- Those with kidney disease should consult a healthcare provider
- Can interact with certain medications including antibiotics and diuretics`,
    tags: ['magnesium', 'mineral', 'sleep', 'muscle health'],
    date: '2024-02-10',
    author: 'Dr. Robert Chang',
    authorTitle: 'Nutritional Biochemist'
  }
];

// Content categories
const contentCategories = [
  { id: 'all', name: 'All Content' },
  { id: 'vitamin', name: 'Vitamins' },
  { id: 'mineral', name: 'Minerals' },
  { id: 'sleep', name: 'Sleep' },
  { id: 'herbs', name: 'Herbs' },
  { id: 'gut', name: 'Gut Health' },
];

function LearnScreen() {
  const { user } = useAuth();
  const { colors, isDarkMode } = useTheme();
  const themedStyles = getThemedStyles(colors);
  
  const [loading, setLoading] = useState(true);
  const [articles, setArticles] = useState([]);
  const [filteredArticles, setFilteredArticles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const screenWidth = Dimensions.get('window').width;
  
  // Load educational content
  useEffect(() => {
    const loadContent = async () => {
      try {
        // In a real app, these would be API calls
        await new Promise(resolve => setTimeout(resolve, 800));
        setArticles(mockArticles);
        setFilteredArticles(mockArticles);
      } catch (error) {
        console.error('Error loading educational content:', error);
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, []);

  // Filter articles based on search and category
  useEffect(() => {
    let filtered = articles;
    
    // Filter by search query
    if (searchQuery) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(lowerCaseQuery) || 
        item.content.toLowerCase().includes(lowerCaseQuery) ||
        item.summary.toLowerCase().includes(lowerCaseQuery) ||
        item.tags.some(tag => tag.toLowerCase().includes(lowerCaseQuery))
      );
    }
    
    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => 
        item.category.toLowerCase().includes(selectedCategory.toLowerCase())
      );
    }
    
    setFilteredArticles(filtered);
  }, [searchQuery, selectedCategory, articles]);

  // Open article detail modal
  const openArticleDetail = (article) => {
    setSelectedArticle(article);
    setModalVisible(true);
  };

  // Render markdown-like content with basic formatting
  const renderFormattedContent = (content) => {
    if (!content) return null;
    
    // Split content by newlines
    const lines = content.split('\n');
    
    return lines.map((line, index) => {
      // Heading 3 (###)
      if (line.startsWith('### ')) {
        return (
          <Text key={index} style={[styles.contentHeading, { color: colors.text }]}>
            {line.substring(4)}
          </Text>
        );
      }
      // Bold/List item (- )
      else if (line.trim().startsWith('- ')) {
        return (
          <View key={index} style={styles.listItemContainer}>
            <Text style={[styles.listBullet, { color: colors.primary }]}>•</Text>
            <Text style={[styles.listItemText, { color: colors.text }]}>
              {line.substring(line.indexOf('- ') + 2)}
            </Text>
          </View>
        );
      }
      // Numbered List (1., 2., etc.)
      else if (/^\d+\.\s/.test(line.trim())) {
        const number = line.trim().match(/^\d+/)[0];
        return (
          <View key={index} style={styles.listItemContainer}>
            <Text style={[styles.listNumber, { color: colors.primary }]}>{number}.</Text>
            <Text style={[styles.listItemText, { color: colors.text }]}>
              {line.trim().substring(number.length + 2)}
            </Text>
          </View>
        );
      }
      // Bold Text
      else if (line.trim().startsWith('**') && line.trim().endsWith('**')) {
        return (
          <Text key={index} style={[styles.boldText, { color: colors.text }]}>
            {line.trim().substring(2, line.trim().length - 2)}
          </Text>
        );
      }
      // Empty line as paragraph break
      else if (line.trim() === '') {
        return <View key={index} style={{ height: 12 }} />;
      }
      // Regular paragraph
      else {
        return (
          <Text key={index} style={[styles.contentParagraph, { color: colors.text }]}>
            {line}
          </Text>
        );
      }
    });
  };

  // Render article cards
  const renderArticleCard = ({ item }) => (
    <TouchableOpacity 
      style={[styles.articleCard, { backgroundColor: colors.cardBg, shadowColor: colors.text }]} 
      onPress={() => openArticleDetail(item)}
    >
      <Image 
        source={{ uri: item.image }} 
        style={styles.articleImage} 
      />
      <View style={styles.articleCardContent}>
        <View style={styles.articleCardHeader}>
          <Text style={[styles.articleCategory, { color: colors.primary }]}>
            {item.category}
          </Text>
          <View style={styles.readTimeContainer}>
            <Ionicons name="time-outline" size={12} color={colors.textSecondary} />
            <Text style={[styles.readTime, { color: colors.textSecondary }]}>
              {item.readTime} min read
            </Text>
          </View>
        </View>
        <Text style={[styles.articleTitle, { color: colors.text }]}>{item.title}</Text>
        <Text 
          style={[styles.articleSummary, { color: colors.textSecondary }]} 
          numberOfLines={2}
        >
          {item.summary}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading content...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={styles.header}>
          <Logo width={150} />
        </View>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={[styles.searchBar, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
            <Ionicons name="search" size={20} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search for topics, nutrients..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        {/* Categories */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesContent}
        >
          {contentCategories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryChip,
                selectedCategory === category.id && styles.categoryChipSelected,
                { 
                  backgroundColor: selectedCategory === category.id ? colors.primary : colors.inputBg,
                  borderColor: colors.border
                }
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === category.id && styles.categoryTextSelected,
                  { color: selectedCategory === category.id ? colors.secondary : colors.text }
                ]}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        {/* Content List */}
        {filteredArticles.length === 0 ? (
          <View style={styles.noResultsContainer}>
            <Ionicons name="search-outline" size={60} color={colors.textSecondary} />
            <Text style={[styles.noResultsText, { color: colors.textSecondary }]}>
              No articles found for "{searchQuery}"
            </Text>
            <TouchableOpacity 
              style={[styles.resetButton, { backgroundColor: colors.primary }]}
              onPress={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
            >
              <Text style={[styles.resetButtonText, { color: colors.secondary }]}>Reset Filters</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filteredArticles}
            renderItem={renderArticleCard}
            keyExtractor={item => item.id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.articlesContainer}
          />
        )}
      </View>
      
      {/* Article Detail Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
          <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity 
                style={[styles.backButton, { backgroundColor: colors.inputBg }]}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="arrow-back" size={22} color={colors.text} />
              </TouchableOpacity>
              <View style={styles.modalHeaderRight}>
                <TouchableOpacity style={[styles.shareButton, { backgroundColor: colors.inputBg }]}>
                  <Ionicons name="share-outline" size={22} color={colors.text} />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.bookmarkButton, { backgroundColor: colors.inputBg }]}>
                  <Ionicons name="bookmark-outline" size={22} color={colors.text} />
                </TouchableOpacity>
              </View>
            </View>
            
            {selectedArticle && (
              <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                <Image 
                  source={{ uri: selectedArticle.image }} 
                  style={styles.modalImage}
                />
                
                <View style={styles.articleDetailContainer}>
                  <View style={styles.articleDetailHeader}>
                    <Text style={[styles.modalCategory, { color: colors.primary }]}>
                      {selectedArticle.category}
                    </Text>
                    <View style={styles.readTimeContainer}>
                      <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                      <Text style={[styles.modalReadTime, { color: colors.textSecondary }]}>
                        {selectedArticle.readTime} min read
                      </Text>
                    </View>
                  </View>
                  
                  <Text style={[styles.modalTitle, { color: colors.text }]}>
                    {selectedArticle.title}
                  </Text>
                  
                  <View style={styles.authorContainer}>
                    <View style={[styles.authorAvatar, { backgroundColor: colors.primary }]}>
                      <Text style={[styles.authorInitial, { color: colors.secondary }]}>
                        {selectedArticle.author.charAt(0)}
                      </Text>
                    </View>
                    <View>
                      <Text style={[styles.authorName, { color: colors.text }]}>
                        {selectedArticle.author}
                      </Text>
                      <Text style={[styles.authorTitle, { color: colors.textSecondary }]}>
                        {selectedArticle.authorTitle}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={[styles.contentDivider, { backgroundColor: colors.border }]} />
                  
                  <View style={styles.articleContent}>
                    {renderFormattedContent(selectedArticle.content)}
                  </View>
                  
                  <View style={styles.tagContainer}>
                    <Text style={[styles.tagLabel, { color: colors.textSecondary }]}>Tags:</Text>
                    <View style={styles.tagList}>
                      {selectedArticle.tags.map((tag, index) => (
                        <View 
                          key={index} 
                          style={[styles.tagChip, { backgroundColor: colors.inputBg }]}
                        >
                          <Text style={[styles.tagText, { color: colors.text }]}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              </ScrollView>
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 10,
    height: 40,
  },
  categoriesContainer: {
    marginBottom: 16,
  },
  categoriesContent: {
    paddingRight: 16,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
  },
  categoryChipSelected: {
    borderWidth: 0,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  categoryTextSelected: {
    fontWeight: '600',
  },
  articlesContainer: {
    paddingBottom: 20,
  },
  articleCard: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  articleImage: {
    width: '100%',
    height: 180,
  },
  articleCardContent: {
    padding: 16,
  },
  articleCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  articleCategory: {
    fontSize: 14,
    fontWeight: '600',
  },
  readTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readTime: {
    fontSize: 12,
    marginLeft: 4,
  },
  articleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  articleSummary: {
    fontSize: 14,
    lineHeight: 20,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  noResultsText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 20,
  },
  resetButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  
  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
  },
  modalHeaderRight: {
    flexDirection: 'row',
  },
  shareButton: {
    padding: 8,
    borderRadius: 20,
    marginRight: 12,
  },
  bookmarkButton: {
    padding: 8,
    borderRadius: 20,
  },
  modalContent: {
    flex: 1,
  },
  modalImage: {
    width: '100%',
    height: 220,
    resizeMode: 'cover',
  },
  articleDetailContainer: {
    padding: 20,
  },
  articleDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalCategory: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalReadTime: {
    fontSize: 14,
    marginLeft: 4,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    lineHeight: 32,
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  authorInitial: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
  },
  authorTitle: {
    fontSize: 14,
  },
  contentDivider: {
    height: 1,
    marginBottom: 20,
  },
  articleContent: {
    marginBottom: 20,
  },
  contentHeading: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 12,
  },
  contentParagraph: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 12,
  },
  listItemContainer: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingLeft: 10,
  },
  listBullet: {
    fontSize: 16,
    marginRight: 10,
  },
  listNumber: {
    fontSize: 16,
    marginRight: 10,
  },
  listItemText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
  },
  boldText: {
    fontWeight: 'bold',
    fontSize: 16,
    marginVertical: 8,
  },
  tagContainer: {
    marginTop: 10,
  },
  tagLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  tagList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tagChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 14,
  }
});

export default withAuth(LearnScreen); 