import { promisify } from 'util';
import { createClient } from 'redis';

const redis = require('redis');

class RedisClient {
    constructor() {
        this.client = redis.createClient()

        this.client.on('error', (err) => {
            console.error('Redis Client Error:', err);
        });
    }

    isAlive() {
        return this.client.connected;
    }

    async get(key) {
        return promisify(this.client.get).bind(this.client)(key);
    }

    async set(key, value, duration) {
        await promisify(this.client.SETEX).bind(this.client)(key, value, duration);
    }

    async del(key) {
        await promisify(this.client.DEL).bind(this.client)(key);
    }
}

export const redisClient = new RedisClient();
export default redisClient;
