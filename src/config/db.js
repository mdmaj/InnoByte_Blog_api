
import dns from "node:dns";
import mongoose from "mongoose";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error(
      "Missing MONGODB_URI or MONGO_URI in the environment"
    );
  }

  console.log("DNS servers:", dns.getServers());

  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 10000,
  });

  console.log("MongoDB connected successfully");
};

export default connectDB;
