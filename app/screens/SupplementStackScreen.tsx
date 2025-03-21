import React, { useState } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Image } from 'react-native';
import { Button, Icon } from '@rneui/themed';

// Sample data - in a real app, this would come from an API or local database
const SAMPLE_SUPPLEMENTS = [
  { id: '1', name: 'Vitamin D', owned: true, description: 'Essential for bone health and immune function.' },
  { id: '2', name: 'Vitamin B Complex', owned: true, description: 'Important for energy production and nerve function.' },
  { id: '3', name: 'Vitamin C', owned: false, description: 'Supports immune system and acts as an antioxidant.' },
  { id: '4', name: 'Magnesium', owned: true, description: 'Critical for muscle and nerve function, bone health, and energy production.' },
  { id: '5', name: "Lion's Mane", owned: false, description: 'May support brain health and cognitive function.' },
  { id: '6', name: 'Omega-3', owned: false, description: 'Important for heart health and brain function.' },
];

const SupplementStackScreen = () => {
  const [supplements, setSupplements] = useState(SAMPLE_SUPPLEMENTS);
  const [selectedSupplement, setSelectedSupplement] = useState(null);

  const renderSupplementItem = ({ item }) => {
    return (
      <TouchableOpacity 
        style={[styles.supplementItem, !item.owned && styles.missingItem]}
        onPress={() => setSelectedSupplement(item)}
      >
        <View style={styles.supplementIcon}>
          <Icon 
            name="healing" 
            type="material" 
            size={30} 
            color={item.owned ? '#DAA520' : '#cccccc'} 
          />
        </View>
        <Text style={[styles.supplementName, !item.owned && styles.missingText]}>
          {item.name}
        </Text>
        {!item.owned && (
          <TouchableOpacity style={styles.buyButton}>
            <Text style={styles.buyButtonText}>Buy</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Supplement Stack</Text>
      
      <FlatList
        data={supplements}
        renderItem={renderSupplementItem}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={styles.supplementList}
      />
      
      {selectedSupplement && (
        <View style={styles.supplementDetail}>
          <Text style={styles.detailTitle}>{selectedSupplement.name}</Text>
          <Text style={styles.detailDescription}>{selectedSupplement.description}</Text>
          <Button
            title={selectedSupplement.owned ? "Mark as Needed" : "Buy Now"}
            buttonStyle={[
              styles.detailButton, 
              !selectedSupplement.owned && styles.buyNowButton
            ]}
            onPress={() => {
              if (!selectedSupplement.owned) {
                // This would open an Amazon or store link in a real app
                alert('This would open Amazon to purchase ' + selectedSupplement.name);
              } else {
                // Toggle ownership (just for demo purposes)
                setSupplements(supplements.map(sup => 
                  sup.id === selectedSupplement.id ? {...sup, owned: !sup.owned} : sup
                ));
                setSelectedSupplement(null);
              }
            }}
          />
          <Button
            title="Close"
            type="outline"
            buttonStyle={styles.closeButton}
            onPress={() => setSelectedSupplement(null)}
          />
        </View>
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
  supplementList: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  supplementItem: {
    width: 150,
    height: 150,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    margin: 8,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  missingItem: {
    opacity: 0.6,
    backgroundColor: '#f0f0f0',
  },
  supplementIcon: {
    marginBottom: 10,
  },
  supplementName: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    color: '#444',
  },
  missingText: {
    color: '#999',
  },
  buyButton: {
    backgroundColor: '#DAA520',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 8,
  },
  buyButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  supplementDetail: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  detailDescription: {
    fontSize: 16,
    color: '#555',
    marginBottom: 20,
    lineHeight: 22,
  },
  detailButton: {
    backgroundColor: '#DAA520',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  buyNowButton: {
    backgroundColor: '#4CAF50',
  },
  closeButton: {
    borderColor: '#DAA520',
    borderRadius: 8,
    padding: 12,
  }
});

export default SupplementStackScreen; 