const jwt= require("jsonwebtoken")
module.exports =function auth(req,res,next){//next() means “go to the next handler” like in the route we have auth,(req,res) so there if the auth works then go to next handler , like here req,res.
   const authHeader = req.headers.authorization;

    
    const token = authHeader?.split(" ")[1] || req.query.token;//"Bearer <token>" → split → extract actual token.
      if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }
     try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
    next();
     
       } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }


};