import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
const options = { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 };
const dummy = `scrypt-v1:${"00".repeat(16)}:${"00".repeat(64)}`;

async function key(password: string, salt: Buffer) {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, 64, options, (error, result) => error ? reject(error) : resolve(result));
  });
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  return `scrypt-v1:${salt.toString("hex")}:${(await key(password, salt)).toString("hex")}`;
}

export async function checkPassword(password: string, hash?: string) {
  const formatted = /^scrypt-v1:[0-9a-f]{32}:[0-9a-f]{128}$/.test(hash ?? "");
  const [, salt, expected] = (formatted ? hash! : dummy).split(":");
  const valid = timingSafeEqual(await key(password, Buffer.from(salt, "hex")), Buffer.from(expected, "hex"));
  return formatted && valid;
}
