import {Redis} from "@upstash/redis";

const redisConfig = {
  url: process.env.REDIS_URL,
  token: process.env.REDIS_TOKEN,
};

export const redis = new Redis(redisConfig);