const sha1 = require('sha1');
const { v4: uuidv4 } = require('uuid');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

class AuthController {
  static async getConnect(request, response) {
    const authData = request.header('Authorization');
    let userData = authData.split(' ')[1];
    const buff = Buffer.from(userData, 'base64');
    userData = buff.toString('ascii');
    const data = userData.split(':'); // contains email and password

    if (data.length !== 2) {
      response.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const hashedPassword = sha1(data[1]);
    const users = dbClient.db.collection('users');
    users.findOne(
      { email: data[0], password: hashedPassword },
      async (err, user) => {
        if (user) {
          const token = uuidv4();
          const key = `auth_${token}`;
          await redisClient.set(key, user._id.toString(), 60 * 60 * 24);
          response.status(200).json({ token });
        } else {
          response.status(401).json({ error: 'Unauthorized' });
        }
      },
    );
  }

  static async getDisconnect(request, response) {
    const token = request.header('X-Token');
    const key = `auth_${token}`;
    const id = await redisClient.get(key);
    if (id) {
      await redisClient.del(key);
      response.status(204).json({});
    } else {
      response.status(401).json({ error: 'Unauthorized' });
    }
  }
}

module.exports = AuthController;
