const { default: mongoose } = require("mongoose");
const Mongoose = require("mongoose");

const UserSchema = new Mongoose.Schema(
  {
    userName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phoneNumber: {
      type: Number,
      required: true,
      unique: true,
    },
    country: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    address: {
      type: String,
      required: true,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    experience: {
      type: String,
    },
    jobDesignation: {
      type: String,
    },
    employeementType: {
      type: String,
    },
    userRole: {
      type: String,
      default: "employee",
      enum: ["employee", "hr", "admin"],
    },
    profileImage: {
      type: String,
    },
    // Digital signature image path (relative, e.g. uploads/signatures/xxx.png)
    signatureImage: {
      type: String,
    },
    accountStatus: {
      type: String,
      default: "active",
      enum: ["active", "inactive"],
    },
    tasks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "task",
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = Mongoose.model("user", UserSchema);
