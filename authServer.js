require('dotenv').config()

const express = require('express')
const app = express()
const jwt = require('jsonwebtoken')
const swaggerJsDoc = require('swagger-jsdoc')
const swaggerUi = require('swagger-ui-express')

//Extended: https://swagger.io/specification/#infoObject
const definition = {

  info: {
    title: "Assignment API",
    description: "Assigment API Information",
    version: "1.0.0",
    contact: {
      name: "Alvian, Christy, Davin"
    }
  },
  servers: ["http://localhost:4000"],
};

const options = {
  definition,
  apis: ["authServer.js"]
}

const swaggerDocs = swaggerJsDoc(options);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.use(express.json())

let refreshTokens = []

const posts = [
  {
    postId: 1,
    username: "alvwjy",
    venueId: 1,
    title: 'Post 1'
  },
  {
    postId: 2,
    username: "alvwjy",
    venueId: 2,
    title: 'Post 2'
  }, {
    postId: 3,
    username: "alextuptonov",
    venueId: 1,
    title: 'Post 3'
  }
]

const venues = [
  {
    venueId: 1,
    venueName: "Jakarta",
    address: "Jakarta Selatan"
  },
  {
    venueId: 2,
    venueName: "Bogor",
    address: "Cibinong"
  }
]

const users = [
  {
    username: "alvwjy",
    password: "1234"
  },
  {
    username: "alextuptonov",
    password: "1234"
  }
]






// Routes
/**
 * @swagger
 * /login:
 *    post:
 *      description: Login to get token
 *      parameters:
 *        - name: username and password
 *          description : '{"username": "your username", "password": "your password"}'
 *          in: body
 *          required: true

 *      responses:
 *        200:
 *          description: Created
 */



app.post('/login', (req, res) => {
  // Authenticate User

  const username = req.body.username
  const password = req.body.password
  const user = { name: username }
  const pass = { password: password }

  for (i = 0; i < users.length; i++) {
    if (users[i].username == user.name && users[i].password == pass.password) {
      const accessToken = generateAccessToken(user)
      const refreshToken = jwt.sign(user, process.env.REFRESH_TOKEN_SECRET)
      refreshTokens.push(refreshToken)
      res.json({ accessToken: accessToken, refreshToken: refreshToken })
      return res.sendStatus(200)
    }
  }
  return res.sendStatus(401)
});


/**
 * @swagger
 * /token:
 *    post:
 *      description: Refresh to get new token
 *      parameters:
 *        - name: Old refresh token
 *          description : '"token": "Old refresh token"}'
 *          in: body
 *          required: true

 *      responses:
 *        200:
 *          description: Created
 */

app.post('/token', (req, res) => {
  const refreshToken = req.body.token
  if (refreshToken == null) return res.sendStatus(401)
  if (!refreshTokens.includes(refreshToken)) return res.sendStatus(403)
  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
    if (err) return res.sendStatus(403)
    const accessToken = generateAccessToken({ name: user.name })
    res.json({ accessToken: accessToken })
  })
})



/**
 * @swagger
 * /logout:
 *    delete:
 *      description: Logout
 *      parameters:
 *        - name: Token
 *          description : '{"token": "Your token"}'
 *          in: body
 *          required: true

 *      responses:
 *        204:
 *          description: Deleted
 */

app.delete('/logout', (req, res) => {
  refreshTokens = refreshTokens.filter(token => token !== req.body.token)
  res.sendStatus(204)
})





/**
 * @swagger
 * /posts:
 *    get:
 *      description: Get post from current user
 *      security:
 *        - Bearer : []
 *      parameters:
 *        - name : Authorization
 *          in : header
 *          schema:
 *            type: string
 *            format: http
 *            required: true
 *            description: Bearer your token
 *          security:
 *            -jwt:[]
 *      responses:
 *        200:
 *          description: Successful
 */

app.get('/posts', authenticateToken, (req, res) => {
  res.json(posts.filter(post => post.username === req.user.name))
})






/**
 * @swagger
 * /venues:
 *    get:
 *      description: Show all venues
 *      security:
 *        - Bearer : []
 *      parameters:
 *        - name : Authorization
 *          in : header
 *          schema:
 *            type: string
 *            format: http
 *            required: true
 *            description: Bearer token
 *          security:
 *            -jwt:[]
 *      responses:
 *        200:
 *          description: Created
 */

app.get('/venues', authenticateToken, (req, res) => {
  res.json(venues)
})



/**
 * @swagger
 * /newuser:
 *    post:
 *      description: Register
 *      parameters:
 *        - name: username and password
 *          description : '{"username": "your username", "password": "your password"}'
 *          in: body
 *          required: true

 *      responses:
 *        201:
 *          description: Created
 */


app.post('/newuser', (req, res) => {
  const username = req.body.username
  const password = req.body.password
  users.push({ username, password });
  console.log(username, password)
  console.log(users)
  return res.sendStatus(201);
})



/**
 * @swagger
 * /newvenue:
 *    post:
 *      description: Create new venue
 *      security:
 *        - Bearer : []
 *      parameters:
 *        - name : Authorization
 *          in : header
 *          schema:
 *            type: string
 *            format: http
 *            required: true
 *            description: Bearer your token
 *        - name: Create new venue
 *          description : '{"venueId" : "New venue ID", "venueName" : "New venue name", "address" : "New address"}'
 *          in: body
 *          required: true
 *          security:
 *            -jwt:[]
 *      responses:
 *        201:
 *          description: Created
 */

app.post('/newvenue', authenticateToken, (req, res) => {
  const venueId = req.body.venueId
  const venueName = req.body.venueName
  const address = req.body.address
  venues.push({ venueId, venueName, address });
  console.log(venues)
  return res.sendStatus(201);
})




/**
 * @swagger
 * /newpost:
 *    post:
 *      description: Delete Venues
 *      security:
 *        - Bearer : []
 *      parameters:
 *        - name : Authorization
 *          in : header
 *          schema:
 *            type: string
 *            format: http
 *            required: true
 *            description: Bearer your token
 *        - name: Create new post
 *          description : '{"postId": "Post ID", "venueId" : "Venue ID", "title" : "Post Title"}'
 *          in: body
 *          required: true
 *          security:
 *            -jwt:[]
 *      responses:
 *        201:
 *          description: Created
 */

app.post('/newpost', authenticateToken, (req, res) => {
  const postId = req.body.postId
  const username = req.user.name
  const venueId = req.body.venueId
  const title = req.body.title

  posts.push({ postId, username, venueId, title })
  console.log(posts);

  return res.sendStatus(201)
})



/**
 * @swagger
 * /post/:id:
 *    put:
 *      description: Modify User Post
 *      security:
 *        - Bearer : []
 *      parameters:
 *        - name : Authorization
 *          in : header
 *          schema:
 *            type: string
 *            format: http
 *            required: true
 *            description: Bearer your token
 *        - name: Create new venue
 *          description : '{"postId" : "Your post ID", "venueId" : "New venue ID", "title" : "New post title"}'
 *          in: body
 *          required: true
 *          security:
 *            -jwt:[]
 *      responses:
 *        201:
 *          description: Created
 */

app.put('/post/:id', authenticateToken, (req, res) => {
  const postId = req.body.postId
  const venueId = req.body.venueId
  const title = req.body.title

  for (i = 0; i < posts.length; i++) {
    if (posts[i].postId == postId && posts[i].username == req.user.name) {
      posts[i].venueId = venueId;
      posts[i].title = title;
      console.log("NEW Posts", posts)
      return res.sendStatus(201)
    }
    return res.sendStatus(404)
  }
})


/**
 * @swagger
 * /user/:username:
 *    put:
 *      description: Modify User Post
 *      security:
 *        - Bearer : []
 *      parameters:
 *        - name : Authorization
 *          in : header
 *          schema:
 *            type: string
 *            format: http
 *            required: true
 *            description: Bearer your token
 *        - name: Create new venue
 *          description : '{"password" : "Your password"}'
 *          in: body
 *          required: true
 *          security:
 *            -jwt:[]
 *      responses:
 *        201:
 *          description: Created
 */
app.put('/user/:username', authenticateToken, (req, res) => {
  const username = req.user.name
  const password = req.body.password
  const user = { name: username }
  const pass = { password: password }

  for (i = 0; i < users.length; i++) {
    if (users[i].username == user.name) {
      users[i].password = pass.password;
      console.log("NEW Users", users)
      return res.sendStatus(201)
    }
    return res.sendStatus(404)
  }
})


/**
 * @swagger
 * /venues/:id:
 *    put:
 *      description: Modify User Post
 *      security:
 *        - Bearer : []
 *      parameters:
 *        - name : Authorization
 *          in : header
 *          schema:
 *            type: string
 *            format: http
 *            required: true
 *            description: Bearer your token
 *        - name: Create new venue
 *          description : '{"venueId" : "Venue ID, "venueName" : "New venue name", "address" : "New venue address"}'
 *          in: body
 *          required: true
 *          security:
 *            -jwt:[]
 *      responses:
 *        201:
 *          description: Created
 */

app.put('/venues/:id', authenticateToken, (req, res) => {
  const venueId = req.body.venueId
  const venueName = req.body.venueName
  const address = req.body.address
  const venue = { venueId: venueId }
  const name = { venueName: venueName }
  const addr = { address: address }

  for (i = 0; i < venues.length; i++) {
    if (venues[i].venueId == venue.venueId) {
      venues[i].venueName = name.venueName
      venues[i].address = addr.address
      console.log("NEW Venues", venues)
      return res.sendStatus(201)
    }
    else {
      return res.sendStatus(404)
    }
  }
})


/**
 * @swagger
 * /post/:id:
 *    delete:
 *      description: Delete User Post
 *      security:
 *        - Bearer : []
 *      parameters:
 *        - name : Authorization
 *          in : header
 *          schema:
 *            type: string
 *            format: http
 *            required: true
 *            description: Bearer your token
*        - name: Venue ID
 *          description : '{"postId": "Post ID you want to delete"}'
 *          in: body
 *          required: true
 *          security:
 *            -jwt:[]
 *      responses:
 *        204:
 *          description: Deleted
 */

app.delete('/post/:id', authenticateToken, (req, res) => {
  const postId = req.body.postId

  for (i = 0; i < posts.length; i++) {
    if (posts[i].postId == postId && posts[i].username == req.user.name) {
      posts.splice(i, 1)
      console.log("NEW Posts", posts)
      return res.sendStatus(200)
    }
    return res.sendStatus(404)
  }
})



/**
 * @swagger
 * /venues/:id:
 *    delete:
 *      description: Delete Venues
 *      security:
 *        - Bearer : []
 *      parameters:
 *        - name : Authorization
 *          in : header
 *          schema:
 *            type: string
 *            format: http
 *            required: true
 *            description: Bearer your token
*        - name: Venue ID
 *          description : '{"venueId": "Venue ID you want to delete"}'
 *          in: body
 *          required: true
 *          security:
 *            -jwt:[]
 *      responses:
 *        204:
 *          description: Deleted
 */

app.delete('/venues/:id', authenticateToken, (req, res) => {
  const venueId = req.body.venueId
  const venue = { venueId: venueId }

  for (i = 0; i < venues.length; i++) {
    if (venues[i].venueId == venue.venueId) {
      venues.splice(i, 1)
      console.log("NEW Venues", venues)
      return res.sendStatus(204)
    }
  }
  return res.sendStatus(404)
})



console.log(venues)










function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]
  console.log(req.headers)
  if (token == null) return res.sendStatus(401)
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    console.log(err)
    if (err) return res.sendStatus(403)
    req.user = user
    next()
  })
}


function generateAccessToken(user) {
  return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '10m' })
}



app.listen(4000)
console.log("RUNNING ON PORT 4000");