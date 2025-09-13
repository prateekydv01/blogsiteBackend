import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

//Middlewares
app.use(
    cors({
        origin : process.env.CORS_ORIGIN,
        credentials: true
    })
)
app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended: true , limit:"16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

//Routes
import healthcheckRouter from "./routers/healthCheck.routes.js"
import userRouter from "./routers/user.router.js"
import blogRouter from "./routers/blog.routes.js"
app.use("/api/v1/healthcheck", healthcheckRouter)
app.use("/api/v1/user",userRouter)
app.use("/api/v1/blog",blogRouter)



// Global error handler
app.use((err, req, res, next) => {

  const statusCode = err.statuscode || 500;
  return res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    errors: err.errors || [],
    data: err.data || null,
  });
});

export {app}