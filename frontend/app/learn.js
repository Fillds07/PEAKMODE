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
        item.summary.toLowerCase().includes(lowerCaseQuery) ||
        item.tags.some(tag => tag.includes(lowerCaseQuery))
      );
    }
    
    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => {
        const lowerCaseCategory = item.category.toLowerCase();
        switch(selectedCategory) {
          case 'vitamin':
            return lowerCaseCategory.includes('vitamin');
          case 'mineral':
            return lowerCaseCategory.includes('mineral');
          case 'sleep':
            return lowerCaseCategory.includes('sleep') || item.tags.includes('sleep');
          case 'herbs':
            return lowerCaseCategory.includes('herb') || item.tags.includes('herbs');
          case 'gut':
            return lowerCaseCategory.includes('gut') || item.tags.includes('gut health');
          default:
            return true;
        }
      });
    }
    
    setFilteredArticles(filtered);
  }, [searchQuery, selectedCategory, articles]);

  // View article details
  const openArticleDetail = (article) => {
    setSelectedArticle(article);
    setModalVisible(true);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading educational content...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Function to convert markdown-like content to basic formatted paragraphs
  const renderFormattedContent = (content) => {
    // Split content into paragraphs
    const paragraphs = content.split('\n\n');
    
    return paragraphs.map((paragraph, index) => {
      // Check if it's a header
      if (paragraph.startsWith('###')) {
        return (
          <Text key={index} style={styles.contentHeader}>
            {paragraph.replace('###', '').trim()}
          </Text>
        );
      } 
      // Check if it's a list item
      else if (paragraph.includes('- ')) {
        const listItems = paragraph.split('\n- ');
        return (
          <View key={index} style={styles.listContainer}>
            {listItems.map((item, itemIndex) => {
              if (itemIndex === 0 && !item.startsWith('- ')) {
                return <Text key={`${index}-title-${itemIndex}`} style={styles.contentText}>{item}</Text>;
              }
              const listItemText = itemIndex === 0 ? item.replace('- ', '') : item;
              return (
                <View key={`${index}-item-${itemIndex}`} style={styles.listItem}>
                  <Text style={styles.bulletPoint}>•</Text>
                  <Text style={styles.listItemText}>{listItemText}</Text>
                </View>
              );
            })}
          </View>
        );
      } 
      // Regular paragraph
      else {
        return (
          <Text key={index} style={styles.contentText}>
            {paragraph}
          </Text>
        );
      }
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Header Section */}
        <View style={styles.header}>
          <Logo width={150} />
          <Text style={styles.title}>Learn & Grow</Text>
        </View>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search articles..."
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
          {contentCategories.map(category => (
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
          {filteredArticles.length} {filteredArticles.length === 1 ? 'article' : 'articles'} found
        </Text>
        
        {/* Articles List */}
        {filteredArticles.length > 0 ? (
          filteredArticles.map(article => (
            <TouchableOpacity
              key={article.id}
              style={styles.articleCard}
              onPress={() => openArticleDetail(article)}
            >
              <Image source={{ uri: article.image }} style={styles.articleImage} />
              <View style={styles.articleContent}>
                <View style={styles.articleMeta}>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{article.category}</Text>
                  </View>
                  <Text style={styles.readTime}>{article.readTime} min read</Text>
                </View>
                
                <Text style={styles.articleTitle}>{article.title}</Text>
                <Text style={styles.articleSummary} numberOfLines={3}>{article.summary}</Text>
                
                <View style={styles.articleFooter}>
                  <Text style={styles.articleDate}>{article.date}</Text>
                  <Text style={styles.readMoreText}>Read more</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.noResultsContainer}>
            <Ionicons name="search" size={60} color={COLORS.border} />
            <Text style={styles.noResultsText}>No articles found</Text>
            <Text style={styles.noResultsSubtext}>Try adjusting your search or filters</Text>
          </View>
        )}
      </ScrollView>
      
      {/* Article Detail Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <View style={styles.modalHeaderRight}>
              <TouchableOpacity style={styles.shareButton}>
                <Ionicons name="share-outline" size={24} color={COLORS.text} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.bookmarkButton}>
                <Ionicons name="bookmark-outline" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
          </View>
          
          {selectedArticle && (
            <ScrollView style={styles.modalBody} contentContainerStyle={styles.modalBodyContent}>
              <Image source={{ uri: selectedArticle.image }} style={styles.modalImage} />
              
              <View style={styles.articleMetaDetail}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{selectedArticle.category}</Text>
                </View>
                <Text style={styles.readTime}>{selectedArticle.readTime} min read</Text>
              </View>
              
              <Text style={styles.modalTitle}>{selectedArticle.title}</Text>
              
              <View style={styles.authorSection}>
                <Text style={styles.authorName}>By {selectedArticle.author}</Text>
                <Text style={styles.authorTitle}>{selectedArticle.authorTitle}</Text>
                <Text style={styles.publishDate}>Published on {selectedArticle.date}</Text>
              </View>
              
              <View style={styles.contentContainer}>
                {renderFormattedContent(selectedArticle.content)}
              </View>
              
              <View style={styles.tagsContainer}>
                <Text style={styles.tagsTitle}>Related Topics:</Text>
                <View style={styles.tagsList}>
                  {selectedArticle.tags.map((tag, index) => (
                    <View key={index} style={styles.tagBadge}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
              
              <View style={styles.relatedArticles}>
                <Text style={styles.relatedTitle}>You might also like:</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.relatedArticlesContent}
                >
                  {articles
                    .filter(a => a.id !== selectedArticle.id)
                    .slice(0, 3)
                    .map(article => (
                      <TouchableOpacity 
                        key={article.id} 
                        style={styles.relatedArticleCard}
                        onPress={() => {
                          setSelectedArticle(article);
                          // Scroll back to top when changing articles
                          if (this.scrollView) {
                            this.scrollView.scrollTo({ x: 0, y: 0, animated: true });
                          }
                        }}
                      >
                        <Image source={{ uri: article.image }} style={styles.relatedArticleImage} />
                        <View style={styles.relatedArticleContent}>
                          <Text style={styles.relatedArticleTitle} numberOfLines={2}>{article.title}</Text>
                          <Text style={styles.relatedArticleReadTime}>{article.readTime} min read</Text>
                        </View>
                      </TouchableOpacity>
                    ))
                  }
                </ScrollView>
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
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
  articleCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  articleImage: {
    width: '100%',
    height: 180,
  },
  articleContent: {
    padding: 16,
  },
  articleMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryBadge: {
    backgroundColor: COLORS.primary + '20', // 20% opacity
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  categoryText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  readTime: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  articleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
    lineHeight: 24,
  },
  articleSummary: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  articleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  articleDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  readMoreText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
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
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.cardBg,
  },
  backButton: {
    padding: 8,
  },
  modalHeaderRight: {
    flexDirection: 'row',
  },
  shareButton: {
    padding: 8,
    marginRight: 8,
  },
  bookmarkButton: {
    padding: 8,
  },
  modalBody: {
    flex: 1,
  },
  modalBodyContent: {
    paddingBottom: 40,
  },
  modalImage: {
    width: '100%',
    height: 240,
  },
  articleMetaDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    lineHeight: 32,
  },
  authorSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  authorTitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  publishDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  contentContainer: {
    padding: 20,
  },
  contentHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 20,
    marginBottom: 10,
  },
  contentText: {
    fontSize: 16,
    color: COLORS.text,
    lineHeight: 24,
    marginBottom: 16,
  },
  listContainer: {
    marginBottom: 16,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingLeft: 8,
  },
  bulletPoint: {
    fontSize: 16,
    color: COLORS.primary,
    marginRight: 8,
    lineHeight: 24,
  },
  listItemText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    lineHeight: 24,
  },
  tagsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tagsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 10,
  },
  tagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tagBadge: {
    backgroundColor: COLORS.inputBg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 14,
    color: COLORS.text,
  },
  relatedArticles: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  relatedTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  relatedArticlesContent: {
    paddingRight: 20,
  },
  relatedArticleCard: {
    width: 200,
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  relatedArticleImage: {
    width: '100%',
    height: 120,
  },
  relatedArticleContent: {
    padding: 12,
  },
  relatedArticleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
    lineHeight: 20,
  },
  relatedArticleReadTime: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});

// Wrap the component with the auth HOC
export default withAuth(LearnScreen); 