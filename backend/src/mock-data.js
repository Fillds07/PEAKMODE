/**
 * Mock Database for Development
 * 
 * This file provides a simple in-memory mock database when MongoDB connection fails.
 * It includes basic CRUD operations for testing the API without a real database.
 */

// Simple in-memory storage
const data = {
  users: [
    {
      _id: '1',
      username: 'fillds07',
      email: 'fillds07@example.com',
      password: '$2a$10$Fh6GbQezZshaF0SEZjRYUesyudaEoMPuKj2YGJQeKZVrOO7YXqKjm', // hashed version of 'password'
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01')
    }
  ]
};

// Mock user model
const User = {
  findOne: async (query) => {
    console.log('Mock DB: Finding user with query:', query);
    
    if (query.username) {
      return data.users.find(user => user.username === query.username) || null;
    }
    
    if (query.email) {
      return data.users.find(user => user.email === query.email) || null;
    }
    
    if (query._id) {
      return data.users.find(user => user._id === query._id) || null;
    }
    
    return null;
  },
  
  create: async (userData) => {
    console.log('Mock DB: Creating user:', userData);
    const newUser = {
      _id: String(data.users.length + 1),
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    data.users.push(newUser);
    return newUser;
  },
  
  findByIdAndUpdate: async (id, updateData) => {
    console.log('Mock DB: Updating user with ID:', id);
    const user = data.users.find(user => user._id === id);
    
    if (!user) return null;
    
    Object.assign(user, updateData, { updatedAt: new Date() });
    return user;
  }
};

module.exports = {
  User,
  mockData: data
}; 