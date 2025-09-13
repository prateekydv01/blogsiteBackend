import {Router} from "express"
import {upload} from "../middlewares/multer.middleware.js"
import {verifyJWT} from '../middlewares/auth.middleware.js'
import { activePostsByUser, createPost, deletePost, getAllPosts, getFilePreview, getPostById, inactivePostsByUser, updatePost } from "../controllers/blog.controlller.js"

const router = Router()

router.route('/create-post').post(
    verifyJWT,
    upload.single("image"),createPost
)

router.route('/:postId').patch(
    verifyJWT,
    upload.single("image"),updatePost
)

router.route('/fetch/:postId').get(getPostById)
router.route('/:postId').delete(verifyJWT,deletePost)
router.route('/posts/all-active').get(getAllPosts)
router.route('/posts/inactive').get(verifyJWT,inactivePostsByUser)
router.route('/posts/active').get(verifyJWT,activePostsByUser)
router.get('/preview/:fileId', getFilePreview)

export default router