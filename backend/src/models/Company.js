import mongoose from "mongoose";

const companySchema = new mongoose.Schema({
  symbol:     { type: String, required: true, unique: true, uppercase: true },
  name:       { type: String, required: true },
  exchange:   { type: String },
  sector:     { type: String },
  industry:   { type: String },
  description:{ type: String },
  logoUrl:    { type: String },
}, { timestamps: true });

export const Company = mongoose.model("Company", companySchema);
