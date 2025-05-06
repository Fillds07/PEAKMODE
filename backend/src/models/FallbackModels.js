/**
 * Fallback Models for MongoDB
 * 
 * This file provides mock implementations of Mongoose models when MongoDB is unavailable.
 * These models mirror the interface of the real models but work with in-memory data.
 */

// In-memory storage for mock data
const mockData = {
  users: [
    {
      _id: '1',
      username: 'fillds07',
      email: 'fillds07@example.com',
      password: '$2a$10$Fh6GbQezZshaF0SEZjRYUesyudaEoMPuKj2YGJQeKZVrOO7YXqKjm', // hashed 'password'
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01')
    }
  ]
};

// Mock User model
const User = {
  findOne: async (query) => {
    console.log('Mock DB: Finding user with query:', query);
    
    // Match by username
    if (query.username) {
      return mockData.users.find(user => user.username === query.username) || null;
    }
    
    // Match by email
    if (query.email) {
      return mockData.users.find(user => user.email === query.email) || null;
    }
    
    // Match by ID
    if (query._id) {
      return mockData.users.find(user => user._id === query._id) || null;
    }
    
    return null;
  },
  
  // Mock the select method for password retrieval
  findOne: function(query) {
    const result = {
      select: function(fields) {
        const user = mockData.users.find(user => {
          for (const [key, value] of Object.entries(query)) {
            if (user[key] !== value) return false;
          }
          return true;
        });
        
        if (!user) return null;
        
        // Clone user object
        const clonedUser = { ...user };
        
        // Add matchPassword method for authentication
        clonedUser.matchPassword = async function(password) {
          // For the mock implementation, just check if the password is 'password'
          return password === 'password';
        };
        
        return clonedUser;
      }
    };
    
    return result;
  },
  
  create: async (userData) => {
    console.log('Mock DB: Creating user:', userData);
    const newUser = {
      _id: String(mockData.users.length + 1),
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    mockData.users.push(newUser);
    return newUser;
  },
  
  findByIdAndUpdate: async (id, updateData) => {
    console.log('Mock DB: Updating user with ID:', id);
    const user = mockData.users.find(user => user._id === id);
    
    if (!user) return null;
    
    Object.assign(user, updateData, { updatedAt: new Date() });
    return user;
  }
};

module.exports = {
  User,
  mockData
}; 