require("dotenv").config();
const mongoose = require("mongoose");

const connectURL = process.env.MONGO__ULI;
if (!connectURL) {
  console.error("ERROR: MONGO__ULI env variable not set");
  process.exit(1);
}

async function main() {
  await mongoose.connect(connectURL);
  console.log("Connected to DB\n");

  const User = mongoose.model("user", new mongoose.Schema({}, { strict: false }));

  const admins = await User.find({ userRole: "admin" }).lean();

  if (admins.length === 0) {
    console.log("❌ NO ADMIN USERS FOUND in the database!");
    console.log("   Your user might have a different userRole. Listing ALL users:\n");
    const all = await User.find({}).lean();
    all.forEach(u => {
      console.log(`  name: ${u.userName}  |  email: ${u.email}  |  role: ${u.userRole}  |  isSuperAdmin: ${u.isSuperAdmin}`);
    });
  } else {
    console.log(`Found ${admins.length} admin user(s):\n`);
    admins.forEach(u => {
      console.log(`  name: ${u.userName}`);
      console.log(`  email: ${u.email}`);
      console.log(`  userRole: ${u.userRole}`);
      console.log(`  isSuperAdmin: ${u.isSuperAdmin}`);
      console.log(`  _id: ${u._id}`);
      console.log("---");
    });
  }

  await mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });
