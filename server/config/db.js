import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI?.trim().replace(
      /^(mongodb(?:\+srv)?:\/\/)<([^:@/]+)>:/,
      "$1$2:"
    );
    if (!mongoUri) {
      throw new Error("MONGO_URI is missing. Add it to server/.env");
    }

    if (/<[^>]+>/.test(mongoUri)) {
      throw new Error("MONGO_URI still contains a placeholder. Replace it with your MongoDB Atlas connection details in server/.env");
    }

    const connection = await mongoose.connect(mongoUri);
    console.log(`MongoDB connected: ${connection.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
