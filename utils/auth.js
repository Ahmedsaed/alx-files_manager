const redisClient = require('./redis');
const dbClient = require('./db');

class AuthClient {
  static async authenticateUser(token) {
    try {
      const userId = await redisClient.get(`auth_${token}`);
      if (!userId) {
        return null;
      }

      const user = await dbClient.db.collection('users').findOne({ _id: userId });
      return user;
    } catch (error) {
      console.error('Error occurred while authenticating user:', error);
      throw error; // Re-throw the error to be caught by the caller
    }
  }
}

module.exports = AuthClient;
