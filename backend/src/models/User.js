import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  name:     { type: String },
  passwordHash: { type: String, required: true },
  role:     { type: String, default: "user", enum: ["user", "admin"] },
}, { timestamps: true });

export const User = mongoose.model("User", userSchema);
