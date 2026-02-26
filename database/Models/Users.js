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
      type: String,
      required: true,
      unique: true,
    },
    addressLine1: {
      type: String,
    },
    country: {
      type: String,
    },
    state: {
      type: String,
    },
    city: {
      type: String,
    },
    zip: {
      type: String,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    address: {
      type: String,
    },
    dateOfBirth: {
      type: Date,
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
    isSuperAdmin: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      default: null,
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
    otpEnabled: {
      type: Boolean,
      default: false,
    },
    otpEnabled: {
      type: Boolean,
      default: false,
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
