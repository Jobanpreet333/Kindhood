const mongoose = require("mongoose")

mongoose.connect(
  MONGO_URI,
  {
    useNewUrlParser: true,
  useUnifiedTopology: true,
  ssl: true,
  tlsAllowInvalidCertificates: false,
  }
).then(() => {
  console.log("✅ Connected to MongoDB Atlas");
}).catch((err) => {
  console.error("❌ MongoDB connection error:", err);
});



