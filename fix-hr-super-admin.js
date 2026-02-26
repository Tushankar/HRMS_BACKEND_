require("dotenv").config();
const mongoose = require("mongoose");

async function main() {
  await mongoose.connect(process.env.MONGO__ULI);
  console.log("Connected\n");

  const User = mongoose.model("user", new mongoose.Schema({}, { strict: false }));

  // Show all HR & admin users
  const users = await User.find({ userRole: { $in: ["hr", "admin"] } }).lean();
  console.log("HR/Admin users:");
  users.forEach(u => console.log(`  ${u.userName} | role: ${u.userRole} | isSuperAdmin: ${u.isSuperAdmin} | _id: ${u._id}`));

  // Set isSuperAdmin=true on ALL hr users (the HR is the super admin)
  const r = await User.updateMany(
    { userRole: "hr" },
    { $set: { isSuperAdmin: true } }
  );
  console.log(`\n✅ Set isSuperAdmin=true on ${r.modifiedCount} HR user(s)`);

  // Verify
  const hrs = await User.find({ userRole: "hr" }).lean();
  hrs.forEach(u => console.log(`  ${u.userName} | isSuperAdmin: ${u.isSuperAdmin}`));

  await mongoose.disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
