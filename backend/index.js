const express = require("express")
const app = express()
const mongoose = require("mongoose")
const dotenv = require("dotenv")
const bcrypt = require("bcrypt")
const Sign = require("./model/Sign")
const Help = require("./model/Help")
const Login = require("./model/Login")
const Feedback = require('./model/Feedback')
const Chat = require('./model/Chats')
const cors = require('cors');
const jwt = require("jsonwebtoken");
const http = require("http");
const setupSocket = require("./socketServer");
const { useRef } = require("react")
app.use(cors())
const { Server } = require("socket.io");
app.use(express.json())
const server = http.createServer(app);

dotenv.config();

const PORT = process.env.PORT;
const MONGO_URI = process.env.MONGO_URI;

app.post("/sign", async (req, res) => {
  try {
    const { name, email, password, address, pin } = req.body;

    // ✅ Await the database query
    const user = await Sign.findOne({ email });

    if (user) {
      return res.status(409).json({ message: "User with this Email already exists!" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new Sign({ name, email, password: hashedPassword, address, pin });

    await newUser.save(); // ✅ Await save()

    return res.status(201).json({ message: "Account Created Successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error Saving Data" });
  }
});

const JWT_SECRET = process.env.JWT_SECRET;
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.json({ message: "Please fill all the Fields." })
    }
    const user = await Sign.findOne({ email });
    if (!user) {
      return res.json({ message: "User With this Email does not Exists!!" })
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
      const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });
      const email = user.email;
      const { _id, name,address } = user.toObject(); 
      // const address  = user.address
      res.status(200).json({ _id: _id.toString(), name, email, token ,address});
    }
    else {
      return res.json({ message: "Invalid Email Or Password!" })
    }
  } catch (error) {
    console.log(error);
    return res.json({ message: "Error Saving Data!" })
  }
})





app.post("/needhelp", async (req, res) => {
  try {
    console.log("Received Data:", req.body);

    const { name, contact, type, description, locations, userId } = req.body;
    console.log(userId);
    if (!name || !contact || !type || !description || !locations) {
      return res.status(400).json({ message: "Please Fill All the Fields!!" });
    }

    const newUser = new Help({ name, contact, type, description, locations, userId });

    await newUser.save();
    console.log("Data saved!");

    return res.json({ message: "Post Added!" });
  } catch (error) {
    console.error("Error Saving Help Post:", error);
    return res.status(500).json({ message: "Error Saving Data!" });
  }
});


app.get("/lendhelp", async (req, res) => {
  try {
    const user = await Help.find();
    return res.json(user);

  } catch (error) {
    console.error("Error fetching help posts:", error);
    return res.status(500).json({ message: "Server Error" });
  }
})


app.post("/feedback", (req, res) => {
  const { name, email, rating, feedbackType, message } = req.body;

  if (!name || !email || !rating || !feedbackType) {
    return res.json({ message: "Please Fill all the Fields" });

  }

  const newMessage = new Feedback({ name, email, rating, feedbackType, message });
  newMessage.save();

  return res.json({ message: "Your Feedback has been Saved!!" });
})

app.get("/feedbackGet", async (req, res) => {
  try {
    const feedbacks = await Feedback.find();
    return res.json(feedbacks);
  } catch (error) {
    console.error("Error fetching help feedbacks:", error);
    return res.status(500).json({ message: "Server Error" });
  }


})

app.get("/user/:id",async(req,res)=>{
  try {
    const user = await Sign.findById(req.params.id);
     if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ name: user.name, email: user.email }); 
  } catch (error) {
     console.error("Error fetching user by ID:", error);
    res.status(500).json({ message: "Server error" });
  }
})


const io = new Server(server,{
  cors:{
    origin:"http://localhost:4000",
    methods:["GET","POST"]
  }
});

const getRoomId = (user1, user2) => {
  if (!user1 || !user2) {
    console.error(" getRoomId: One or both user IDs are undefined", { user1, user2 });
    return null; // or throw an error
  }
  return [user1.toString(), user2.toString()].sort().join("_");
};
io.on("connection",(socket)=>{
  console.log("A user Connected");
  

  socket.on("joinRoom",({senderId,receiverId})=>{
    if ( !senderId || !receiverId) {
    console.error(" joinRoom: Missing data");
    return;
  }
    const roomId = getRoomId(senderId,receiverId);
    socket.join(roomId);
    console.log(`✅ User joined room: ${roomId}`);
  })

  socket.on("sendMessage",async({senderId,receiverId,message})=>{

    const roomId=getRoomId(senderId,receiverId);
     if (!senderId || !receiverId || !message) {
    console.log("❌ Missing data in sendMessage");
    return;
  }

    const chatMessage = new Chat({senderId,receiverId,roomId,message});
    await chatMessage.save();

    io.to(roomId).emit("receiveMessage", {
      senderId,
      message,
      timestamp: new Date()
    });

    
  })
  socket.on("disconnect", () => {
    console.log(" User disconnected");
  });
})


app.get("/messages/:roomId", async (req, res) => {
  try {
    const messages = await Chat.find({ roomId: req.params.roomId }).sort({ timestamp: 1 });
    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching messages" });
  }
});


// 📁 In backend (index.js or routes file)
app.get("/chatUsers/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const chats = await Chat.find({
      $or: [{ senderId: userId }, { receiverId: userId }]
    });

    const userIds = new Set();

    chats.forEach(chat => {
      if (chat.senderId.toString() !== userId) {
        userIds.add(chat.senderId.toString());
      }
      if (chat.receiverId.toString() !== userId) {
        userIds.add(chat.receiverId.toString());
      }
    });

    // Fetch user details
    const users = await Sign.find({ _id: { $in: [...userIds] } }, "name _id");
    res.json(users);
  } catch (err) {
    console.error("Error getting chat users:", err);
    res.status(500).json({ message: "Server error" });
  }
});


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


server.listen(PORT, () => {
  console.log(`App Running at ${PORT}`)
})


