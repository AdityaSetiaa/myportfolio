import mongoose from "mongoose";
import { credentialEmail, credentialPassword } from "../data/cms-schema";
import { Admin } from "../lib/cms-models";
import { mongo } from "../lib/mongodb";
import { hashPassword } from "../lib/password";

const accountId = "000000000000000000000001";

try {
  const email = credentialEmail.parse(process.env.ADMIN_EMAIL);
  const password = credentialPassword.parse(process.env.ADMIN_PASSWORD).normalize("NFKC");
  if (password.length < 16 || password !== process.env.ADMIN_PASSWORD) {
    throw new Error("Use a password with at least 16 characters in normalized form.");
  }
  await mongo();
  await Admin.init();
  const existing = await Admin.findOne({ role: "admin" });
  const replace = process.argv.includes("--replace");
  if (existing && !replace) {
    console.log("An administrator already exists. No changes made.");
  } else {
    const passwordHash = await hashPassword(password);
    if (existing) {
      existing.email = email;
      existing.passwordHash = passwordHash;
      existing.authVersion += 1;
      await existing.save();
      console.log("Administrator credentials replaced and previous sessions revoked.");
    } else {
      await Admin.create({ _id: accountId, email, passwordHash, role: "admin", authVersion: 1 });
      console.log("Administrator created.");
    }
  }
} catch (error) {
  console.error("Administrator setup failed. Check MongoDB and provide a valid email and password of at least 16 characters.", error instanceof Error ? error.name : "");
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
