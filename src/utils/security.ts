import crypto from 'crypto';

type GenerateRandomString = (length?: number) => string;
export const generateRandomString: GenerateRandomString = (length = 16) => {
  return crypto.randomBytes(length).toString('hex');
};

type Decrypt = (data: string, secret: string, algorithm?: string) => string;
export const decrypt: Decrypt = (data, secret, algorithm = 'aes-256-cbc') => {
  const iv = Buffer.from(data.slice(0, 32), 'hex');
  const encryptedText = Buffer.from(data.slice(32), 'hex');
  const decipher = crypto.createDecipheriv(algorithm, secret, iv);
  const decrypted = decipher.update(encryptedText, undefined, 'utf8') + decipher.final('utf8');
  return decrypted;
};

type Encrypt = (data: string, secret: string, algorithm?: string) => string;
export const encrypt: Encrypt = (data, secret, algorithm = 'aes-256-cbc') => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, secret, iv);
  const encrypted = cipher.update(data, 'utf8', 'hex') + cipher.final('hex');
  const encryptedData = iv.toString('hex') + encrypted;
  return encryptedData;
};
