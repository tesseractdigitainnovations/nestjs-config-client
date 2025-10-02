// src/config/config.validation.ts
import * as Joi from 'joi';

// Schema for validating local environment variables used by the config client
export const localConfigSchema = Joi.object({
  CONFIG_SERVER_URL: Joi.string().uri().required(),
  CONFIG_APP_NAME: Joi.string().required(),
  CONFIG_PROFILE: Joi.string().required(),
  CONFIG_REFRESH_INTERVAL: Joi.number().integer().min(0).default(0), // in ms, 0 means no refresh
}).unknown(true); // allow extra keys

// Schema for validating remote configuration fetched from the config server
export const remoteConfigSchema = Joi.object({
  DATABASE_URL: Joi.string().uri().required(),
  JWT_SECRET: Joi.string().min(16).required(),
}).unknown(true); // allow extra keys

// For backward compatibility - use remoteConfigSchema by default
export const configSchema = remoteConfigSchema;
