const express = require("express");
const multer=require("multer");
const path=require("path");
const app = express();
const PORT = 8000;

const storage=multer.diskStorage({
    destination:function(req,file,cb){
        cb(null,"uploads/");//callback(error,where to store)
    },
    filename:function(req,file,cb){
        cb(null,Date.now()+path.extname(file.originalname));

    },
});

const upload=multer({storage:storage});

app.post("/upload",upload.single("file"),(req,res)=>{
    if(!req.file){
        return res.status(400).send("No file uploaded.");
    }
      res.send(`File uploaded successfully: ${req.file.filename}`);

});

app.get("/", (req, res) => {
  res.send("Backend is running ");
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://127.0.0.1:${PORT}`);
});


