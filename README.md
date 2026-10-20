# InnoByte RESTful Blog API

A RESTful Blog API built using **Node.js, Express.js, and MongoDB**. This API provides user authentication, blog post management, and comment management with request validation and resource ownership authorization.

## Features

- User registration and login
- Password hashing using bcryptjs
- JWT-based authentication and protected routes
- Create, read, update, and delete blog posts
- Create, read, update, and delete comments
- Resource ownership checks for posts and comments
- Request validation using Zod
- MongoDB integration using Mongoose
- Security headers using Helmet
- CORS configuration
- Automated API tests using Node.js Test Runner and Supertest
- Centralized environment-based configuration

## Tech Stack

| Technology | Purpose |
|---|---|
| Node.js | JavaScript runtime |
| Express.js | Backend framework |
| MongoDB | Database |
| Mongoose | MongoDB object modeling |
| JSON Web Token (JWT) | Authentication |
| bcryptjs | Password hashing |
| Zod | Request validation |
| Helmet | HTTP security headers |
| CORS | Cross-origin resource sharing |
| Supertest | HTTP API testing |
| Node.js Test Runner | Automated tests |

## Project Structure

```text
InnoByte_Blog_api/
├── src/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── postController.js
│   │   └── commentController.js
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Post.js
│   │   └── Comment.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── postRoutes.js
│   │   └── commentRoutes.js
│   ├── utils/
│   │   └── generateToken.js
│   ├── validators/
│   │   ├── authValidator.js
│   │   ├── postValidator.js
│   │   └── commentValidator.js
│   ├── app.js
│   └── server.js
├── tests/
│   ├── auth.test.js
│   ├── posts.test.js
│   └── comments.test.js
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
```

## Prerequisites

Before running the project, install:

- [Node.js](https://nodejs.org/)
- npm (included with Node.js)
- MongoDB locally or a MongoDB Atlas database
- Git (optional, for cloning the repository)

## Installation and Setup

### 1. Clone the repository

Replace the placeholder URL with your actual GitHub repository URL.

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd InnoByte_Blog_api
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root directory.

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=your_development_mongodb_uri
MONGODB_TEST_URI=your_separate_test_database_uri
JWT_SECRET=your_long_random_secret
JWT_EXPIRES_IN=1d
CLIENT_URL=http://localhost:3000
```

**Important:** Use the exact environment variable names expected by your application. The values above are examples; verify them against your source code before running the project.

- `PORT`: Port used by the server.
- `MONGODB_URI`: Connection string for the application database.
- `MONGODB_TEST_URI`: Connection string for the test database.
- `JWT_SECRET`: Secret used to sign and verify JWTs.
- `JWT_EXPIRES_IN`: JWT expiration configuration, if supported by your token-generation code.
- `CLIENT_URL`: Allowed client origin, if used by your CORS configuration.

Never commit your real `.env` file, database credentials, or JWT secret to GitHub.

### 4. Start the development server

```bash
npm run dev
```

Or start the application normally:

```bash
npm start
```

### 5. Verify the API

Health check endpoint:

```http
GET http://localhost:5000/api/v1/health
```

Base API URL:

```text
http://localhost:5000/api/v1
```

## API Endpoints

All endpoints below use `/api/v1` as the API prefix. Protected endpoints require a valid JWT.

### Authentication

| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/auth/register` | Register a new user | Public |
| POST | `/auth/login` | Log in and receive a JWT | Public |
| GET | `/auth/me` | Get the current authenticated user | Protected |

### Blog Posts

| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/posts` | Create a blog post | Protected |
| GET | `/posts` | Retrieve all posts | Public |
| GET | `/posts/:id` | Retrieve a post by ID | Public |
| PATCH | `/posts/:id` | Update your own post | Protected |
| DELETE | `/posts/:id` | Delete your own post | Protected |

### Comments

| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/posts/:postId/comments` | Add a comment to a post | Protected |
| GET | `/posts/:postId/comments` | Retrieve comments for a post | Public |
| PATCH | `/comments/:id` | Update your own comment | Protected |
| DELETE | `/comments/:id` | Delete your own comment | Protected |

The API also supports additional comment retrieval routes implemented in the application, including retrieval by comment ID and filtering by post ID.

## Example Requests

The following examples illustrate the expected request format. Use valid credentials and resource IDs when testing.

### Register a user

```http
POST /api/v1/auth/register
Content-Type: application/json
```

```json
{
  "name": "Test User",
  "email": "test@example.com",
  "password": "StrongPassword123"
}
```

### Log in

```http
POST /api/v1/auth/login
Content-Type: application/json
```

```json
{
  "email": "test@example.com",
  "password": "StrongPassword123"
}
```

Use the JWT returned by the login endpoint for protected requests.

### Create a blog post

```http
POST /api/v1/posts
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN
```

```json
{
  "title": "My First Blog Post",
  "content": "This is the content of my first blog post."
}
```

### Add a comment

```http
POST /api/v1/posts/POST_ID/comments
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN
```

```json
{
  "content": "Great article!"
}
```

Replace `POST_ID` with the ID of an existing post.

### Update a blog post

```http
PATCH /api/v1/posts/POST_ID
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN
```

```json
{
  "title": "Updated Blog Post Title"
}
```

The user must be authorized to modify the selected resource.

## Authentication and Authorization

The API uses JSON Web Tokens to authenticate users.

For protected endpoints, include the token in the request header:

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

Resource ownership checks prevent users from updating or deleting posts and comments owned by other users.

## Automated Testing

Run the test suite with:

```bash
npm test
```

The project uses the built-in Node.js Test Runner and Supertest to test the API.

**Latest recorded test result:**

- Total tests: 28
- Passed: 28
- Failed: 0

The tests cover authentication, post operations, comment operations, validation, and resource ownership authorization.

## Security

- Passwords are hashed before storage.
- JWT authentication protects private endpoints.
- Ownership checks restrict modifications to authorized resources.
- Zod validates request data.
- Helmet adds security-related HTTP headers.
- CORS controls cross-origin access.
- Environment variables keep sensitive configuration outside source code.

## Author

**Mazid Hussain**

- GitHub: [mdmaj](https://github.com/mdmaj)
- Portfolio: [mdmaj.in](https://www.mdmaj.in/)

## License

Created as part of the InnoByte RESTful Blog API assignment. The repository currently declares the ISC license in `package.json`.
