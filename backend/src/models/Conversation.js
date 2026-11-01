import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema({
  ownerId:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  title:      { type: String, default: "New conversation" },
  companyId:  { type: mongoose.Schema.Types.ObjectId, ref: "Company", default: null },
  documentId: { type: mongoose.Schema.Types.ObjectId, ref: "FinancialDocument", default: null },
}, { timestamps: true });

// Cascade: deleting a conversation deletes its messages.
conversationSchema.pre("findOneAndDelete", async function () {
  const conv = await this.model.findOne(this.getFilter());
  if (conv) {
    const { Message } = await import("./Message.js");
    await Message.deleteMany({ conversationId: conv._id });
  }
});

export const Conversation = mongoose.model("Conversation", conversationSchema);
