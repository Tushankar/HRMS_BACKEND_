require("dotenv").config();
const mongoose = require("mongoose");

const connectURL = process.env.MONGO__ULI;

async function main() {
  await mongoose.connect(connectURL);
  console.log("Connected to DB\n");

  const User = mongoose.model("user", new mongoose.Schema({}, { strict: false }));

  // Set isSuperAdmin = true on ALL admin users that don't have it set
  const result = await User.updateMany(
    { userRole: "admin", $or: [{ isSuperAdmin: { $exists: false } }, { isSuperAdmin: null }, { isSuperAdmin: false }] },
    { $set: { isSuperAdmin: true } }
  );

  console.log(`✅ Updated ${result.modifiedCount} admin user(s) → isSuperAdmin: true`);

  // Verify
  const admins = await User.find({ userRole: "admin" }).lean();
  admins.forEach(u => {
    console.log(`  ${u.userName} | isSuperAdmin: ${u.isSuperAdmin}`);
  });

  await mongoose.disconnect();
  console.log("\nDone!");
}

main().catch(err => { console.error(err); process.exit(1); });
