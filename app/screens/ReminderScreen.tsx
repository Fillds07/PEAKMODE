import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Switch, 
  FlatList, 
  TouchableOpacity,
  Modal,
  Platform
} from 'react-native';
import { Icon, Button } from '@rneui/themed';
import DateTimePicker from '@react-native-community/datetimepicker';

// Mock data - in a real app, this would be saved to/loaded from storage
const INITIAL_REMINDERS = [
  {
    id: '1',
    supplementId: '1',
    supplementName: 'Vitamin D',
    time: new Date(new Date().setHours(8, 0, 0, 0)).toISOString(),
    isEnabled: true,
    days: [0, 1, 2, 3, 4, 5, 6], // All days
  },
  {
    id: '2',
    supplementId: '2',
    supplementName: 'Vitamin B Complex',
    time: new Date(new Date().setHours(8, 15, 0, 0)).toISOString(),
    isEnabled: true,
    days: [0, 1, 2, 3, 4, 5, 6], // All days
  },
  {
    id: '3',
    supplementId: '4',
    supplementName: 'Magnesium',
    time: new Date(new Date().setHours(20, 0, 0, 0)).toISOString(),
    isEnabled: true,
    days: [0, 1, 2, 3, 4, 5, 6], // All days
  },
];

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const ReminderScreen = () => {
  const [reminders, setReminders] = useState(INITIAL_REMINDERS);
  const [isTimePickerVisible, setTimePickerVisible] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState(null);
  const [selectedTime, setSelectedTime] = useState(new Date());
  
  const formatTime = (timeString) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const toggleSwitch = (id) => {
    setReminders(
      reminders.map(reminder => 
        reminder.id === id 
          ? { ...reminder, isEnabled: !reminder.isEnabled } 
          : reminder
      )
    );
  };
  
  const openTimePicker = (reminder) => {
    setSelectedReminder(reminder);
    setSelectedTime(new Date(reminder.time));
    setTimePickerVisible(true);
  };
  
  const handleTimeChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setTimePickerVisible(false);
    }
    
    if (selectedDate) {
      setSelectedTime(selectedDate);
      
      if (selectedReminder) {
        // Update the reminder with the new time
        setReminders(
          reminders.map(reminder => 
            reminder.id === selectedReminder.id 
              ? { ...reminder, time: selectedDate.toISOString() } 
              : reminder
          )
        );
      }
    }
  };
  
  const renderReminderItem = ({ item }) => {
    return (
      <View style={styles.reminderItem}>
        <View style={styles.reminderInfo}>
          <Text style={styles.reminderName}>{item.supplementName}</Text>
          <TouchableOpacity onPress={() => openTimePicker(item)}>
            <Text style={styles.reminderTime}>{formatTime(item.time)}</Text>
          </TouchableOpacity>
          <View style={styles.daysContainer}>
            {DAYS_OF_WEEK.map((day, index) => (
              <Text 
                key={index} 
                style={[
                  styles.dayText, 
                  item.days.includes(index) ? styles.selectedDay : styles.unselectedDay
                ]}
              >
                {day}
              </Text>
            ))}
          </View>
        </View>
        <Switch
          trackColor={{ false: '#d1d1d1', true: '#FFF9E5' }}
          thumbColor={item.isEnabled ? '#DAA520' : '#f4f3f4'}
          onValueChange={() => toggleSwitch(item.id)}
          value={item.isEnabled}
        />
      </View>
    );
  };
  
  const addNewReminder = () => {
    // In a real app, you would show a form to add a new reminder
    alert('In a complete app, this would open a form to add a new reminder.');
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Supplement Reminders</Text>
      
      <FlatList
        data={reminders}
        renderItem={renderReminderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.reminderList}
      />
      
      <Button
        title="Add New Reminder"
        icon={<Icon name="add" type="material" color="white" size={20} style={{ marginRight: 10 }} />}
        buttonStyle={styles.addButton}
        onPress={addNewReminder}
      />
      
      {Platform.OS === 'ios' && (
        <Modal
          visible={isTimePickerVisible}
          transparent={true}
          animationType="slide"
        >
          <View style={styles.modalContainer}>
            <View style={styles.pickerContainer}>
              <Text style={styles.pickerTitle}>Select Time</Text>
              <DateTimePicker
                value={selectedTime}
                mode="time"
                display="spinner"
                onChange={handleTimeChange}
                style={styles.picker}
              />
              <Button
                title="Done"
                buttonStyle={styles.doneButton}
                onPress={() => setTimePickerVisible(false)}
              />
            </View>
          </View>
        </Modal>
      )}
      
      {Platform.OS === 'android' && isTimePickerVisible && (
        <DateTimePicker
          value={selectedTime}
          mode="time"
          is24Hour={false}
          display="default"
          onChange={handleTimeChange}
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
  reminderList: {
    paddingVertical: 10,
  },
  reminderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  reminderInfo: {
    flex: 1,
  },
  reminderName: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  reminderTime: {
    fontSize: 16,
    color: '#DAA520',
    fontWeight: '500',
    marginBottom: 8,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayText: {
    fontSize: 12,
    marginRight: 5,
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 5,
    overflow: 'hidden',
  },
  selectedDay: {
    backgroundColor: '#FFF9E5',
    color: '#DAA520',
    fontWeight: '500',
  },
  unselectedDay: {
    backgroundColor: '#eee',
    color: '#999',
  },
  addButton: {
    backgroundColor: '#DAA520',
    borderRadius: 8,
    marginTop: 20,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  pickerContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  picker: {
    height: 200,
  },
  doneButton: {
    backgroundColor: '#DAA520',
    borderRadius: 8,
    marginTop: 10,
  },
});

export default ReminderScreen; 