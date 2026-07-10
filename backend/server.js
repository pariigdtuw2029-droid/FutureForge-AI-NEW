require("dotenv").config();
const express =require("express");
const connectDB =require("./db");
const projectRoutes =require("./routes/projectRoutes");
const historyRoutes = require("./routes/historyRoutes");
const resumeRoutes =require("./routes/resumeRoutes");
const recommendationRoutes = require("./routes/recommendationRoutes");
const roadmapRoutes = require("./routes/roadmapRoutes");
const cors=require("cors");
const app =express();
app.use(express.json());
connectDB();
const userRoutes = require("./routes/userRoutes");


const PORT =5000;

app.get("/",(req,res)=>{
    res.send("Carrer Intelligence Backend is Running!");
});
app.use("/api/resume", resumeRoutes);
app.use("/api/project",projectRoutes);
app.use("/api/roadmap", roadmapRoutes);
app.use("/api/recommend", recommendationRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/users",userRoutes);
app.use(cors());
console.log("Recommendation route registered!");
app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`);
});