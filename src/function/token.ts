import config from '@/config';
import { decrypt } from '@/utils/security';
import jwt from 'jsonwebtoken';
import { type StringValue } from 'ms';
const { JWT_SECRET, JWT_EXPIRES_IN, JWT_REFRESH_EXPIRES_IN, ENCRYPTION_SECRET } = config;

type GenerateToken = (data: Record<string, unknown>, expiresIn: StringValue) => string;
export const generateToken: GenerateToken = (data, expiresIn) => {
  const secret = decrypt(JWT_SECRET, ENCRYPTION_SECRET);
  return jwt.sign(data, secret, { expiresIn, algorithm: 'RS256' });
};

type GenerateAccessToken = (data: Record<string, unknown>) => string;
export const generateAccessToken: GenerateAccessToken = data => {
  // generate access-token with short life time of 1h using jwt
  // sign data with jwt secret
  // return access token
  return generateToken(data, JWT_EXPIRES_IN);
};

type GenerateRefreshToken = (data: Record<string, unknown>) => string;
export const generateRefreshToken: GenerateRefreshToken = data => {
  return generateToken(data, JWT_REFRESH_EXPIRES_IN);
};
