import React, { useState } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { Icon, Divider } from '@rneui/themed';

// Sample data - in a real app, this would come from an API or local database
const EDUCATION_CATEGORIES = [
  { 
    id: '1', 
    title: 'Supplements', 
    icon: 'flask', 
    type: 'font-awesome',
    content: [
      { id: 's1', title: 'Vitamin D', content: 'Vitamin D is essential for calcium absorption and bone health. It also plays a crucial role in immune function and mood regulation. Many people are deficient in vitamin D, especially those who live in areas with limited sunlight or who spend most of their time indoors.' },
      { id: 's2', title: 'Vitamin B Complex', content: 'B vitamins are essential for energy production, brain function, and cell metabolism. The B complex includes B1 (thiamine), B2 (riboflavin), B3 (niacin), B5 (pantothenic acid), B6 (pyridoxine), B7 (biotin), B9 (folate), and B12 (cobalamin).' },
      { id: 's3', title: 'Vitamin C', content: 'Vitamin C is a powerful antioxidant that supports immune function, collagen production, and iron absorption. It helps protect cells from damage caused by free radicals and is essential for wound healing.' },
      { id: 's4', title: 'Magnesium', content: 'Magnesium is involved in over 300 enzymatic reactions in the body. It supports muscle and nerve function, regulates blood pressure, and is essential for energy production. Many people are deficient in magnesium due to poor diet and soil depletion.' },
      { id: 's5', title: "Lion's Mane", content: "Lion's Mane is a medicinal mushroom that has been studied for its potential cognitive benefits. It may support nerve growth factor (NGF) production, which is important for brain health and function." },
    ]
  },
  { 
    id: '2', 
    title: 'Nutrition', 
    icon: 'nutrition', 
    type: 'material-community',
    content: [
      { id: 'n1', title: 'Macronutrients', content: 'Macronutrients are the nutrients we need in large amounts: proteins, carbohydrates, and fats. Each plays a crucial role in energy production and overall health.' },
      { id: 'n2', title: 'Micronutrients', content: 'Micronutrients are vitamins and minerals needed in smaller amounts but are essential for optimal health and function.' },
      { id: 'n3', title: 'Hydration', content: 'Water is essential for life and proper function. Aim to drink at least 8 glasses of water per day, more if you are active or live in a hot climate.' },
      { id: 'n4', title: 'Meal Timing', content: 'When you eat can be almost as important as what you eat. Spacing your meals throughout the day can help maintain energy levels and support metabolic health.' },
    ]
  },
  { 
    id: '3', 
    title: 'Fasting & Dieting', 
    icon: 'clock-time-eight-outline', 
    type: 'material-community',
    content: [
      { id: 'f1', title: 'Intermittent Fasting', content: 'Intermittent fasting involves cycling between periods of eating and fasting. Common methods include 16/8 (16 hours fasting, 8 hours eating), 5:2 (5 days normal eating, 2 days restricted calories), and alternate-day fasting.' },
      { id: 'f2', title: 'Ketogenic Diet', content: 'The ketogenic diet is a low-carb, high-fat diet that can help the body burn fat more effectively. It involves drastically reducing carbohydrate intake and replacing it with fat, putting the body into a metabolic state called ketosis.' },
      { id: 'f3', title: 'Mediterranean Diet', content: 'The Mediterranean diet emphasizes plant-based foods, whole grains, fish, and healthy fats like olive oil. It is associated with numerous health benefits including reduced risk of heart disease and improved cognitive function.' },
    ]
  },
  { 
    id: '4', 
    title: 'Workouts', 
    icon: 'dumbbell', 
    type: 'material-community',
    content: [
      { id: 'w1', title: 'Full Body Workouts', content: 'Full body workouts target all major muscle groups in a single session. They are efficient for those with limited time and can be done 3-5 times per week with proper recovery.' },
      { id: 'w2', title: 'Push Pull Legs Split', content: 'This split divides workouts into pushing movements (chest, shoulders, triceps), pulling movements (back, biceps), and leg exercises. It allows for more volume per muscle group and is typically done 6 days per week with one rest day.' },
      { id: 'w3', title: 'Cardio Training', content: 'Cardiovascular exercise strengthens the heart and improves endurance. Options include running, cycling, swimming, and high-intensity interval training (HIIT).' },
      { id: 'w4', title: 'Mobility & Recovery', content: 'Mobility work and proper recovery are essential for preventing injury and optimizing performance. Include stretching, foam rolling, and adequate rest in your routine.' },
    ]
  },
];

const EducationScreen = () => {
  const [selectedCategory, setSelectedCategory] = useState(EDUCATION_CATEGORIES[0]);
  const [selectedTopic, setSelectedTopic] = useState(null);

  const renderCategoryItem = ({ item }) => {
    const isSelected = selectedCategory.id === item.id;
    
    return (
      <TouchableOpacity 
        style={[styles.categoryItem, isSelected && styles.selectedCategory]}
        onPress={() => {
          setSelectedCategory(item);
          setSelectedTopic(null);
        }}
      >
        <Icon 
          name={item.icon} 
          type={item.type} 
          size={24} 
          color={isSelected ? '#DAA520' : '#777'} 
        />
        <Text style={[styles.categoryText, isSelected && styles.selectedCategoryText]}>
          {item.title}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderTopicItem = ({ item }) => {
    return (
      <TouchableOpacity 
        style={styles.topicItem}
        onPress={() => setSelectedTopic(item)}
      >
        <Text style={styles.topicTitle}>{item.title}</Text>
        <Icon name="chevron-right" type="material-community" size={24} color="#999" />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Education Center</Text>
      
      <FlatList
        horizontal
        data={EDUCATION_CATEGORIES}
        renderItem={renderCategoryItem}
        keyExtractor={item => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryList}
      />
      
      <Divider style={styles.divider} />
      
      {selectedTopic ? (
        <ScrollView style={styles.contentContainer}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => setSelectedTopic(null)}
          >
            <Icon name="arrow-left" type="material-community" size={20} color="#777" />
            <Text style={styles.backText}>Back to {selectedCategory.title}</Text>
          </TouchableOpacity>
          
          <Text style={styles.contentTitle}>{selectedTopic.title}</Text>
          <Text style={styles.contentText}>{selectedTopic.content}</Text>
        </ScrollView>
      ) : (
        <FlatList
          data={selectedCategory.content}
          renderItem={renderTopicItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.topicList}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  categoryList: {
    paddingVertical: 5,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginRight: 15,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  selectedCategory: {
    backgroundColor: '#FFF9E5', // Light gold background
    borderWidth: 1,
    borderColor: '#DAA520',
  },
  categoryText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#777',
  },
  selectedCategoryText: {
    color: '#DAA520',
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: 15,
  },
  topicList: {
    paddingVertical: 5,
  },
  topicItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    marginBottom: 10,
  },
  topicTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#444',
  },
  contentContainer: {
    flex: 1,
    paddingVertical: 10,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  backText: {
    marginLeft: 5,
    color: '#777',
    fontSize: 14,
  },
  contentTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  contentText: {
    fontSize: 16,
    color: '#555',
    lineHeight: 24,
  },
});

export default EducationScreen; 