
# InnoByte RESTful Blog API

A RESTful Blog API built using Node.js, Express.js, and MongoDB. It provides secure user authentication and APIs for creating, reading, updating, and deleting blog posts and comments.

## Features

- User registration and login
- Password hashing using bcrypt
- JWT-based authentication
- Create, read, update, and delete blog posts
- Create, read, update, and delete comments
- Authorization and resource ownership checks
- Request validation using Zod
- MongoDB database integration with Mongoose
- Security headers using Helmet
- Automated API tests using Node.js Test Runner and Supertest

## Tech Stack

- **Runtime:** Node.js
- **Backend:** Express.js
- **Database:** MongoDB
- **ODM:** Mongoose
- **Authentication:** JSON Web Token (JWT)
- **Password Hashing:** bcrypt
- **Validation:** Zod
- **Testing:** Node.js Test Runner, Supertest
- **Security:** Helmet, CORS

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
├── .env
├── .gitignore
├── package.json
└── README.md
```

## Prerequisites

Make sure you have installed:

- Node.js and npm
- MongoDB Atlas account or a local MongoDB server
- Git (optional)

## Installation

1. Clone the repository:

   ```bash
   git clone YOUR_GITHUB_REPOSITORY_URL
   ```

2. Navigate into the project directory:

   ```bash
   cd InnoByte_Blog_api
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Create a `.env` file in the root directory:

   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=your_development_mongodb_uri
   MONGODB_TEST_URI=your_separate_test_database_uri
   JWT_SECRET=your_long_random_secret
   JWT_EXPIRES_IN=1d
   CLIENT_URL=http://localhost:3000
   ```

   Replace the placeholder values with your own configuration. Never commit real credentials to GitHub.

## Running the Project

Start the development server:

```bash
npm run dev
```

Or start the application normally:

```bash
npm start
```

Health check endpoint:

```http
GET /api/v1/health
```

Base API URL:

```text
http://localhost:5000/api/v1
```

## API Endpoints

### Authentication

| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/auth/register` | Register a new user | Public |
| POST | `/auth/login` | Log in a user | Public |
| GET | `/auth/me` | Get current authenticated user | Protected |

### Blog Posts

| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/posts` | Create a post | Protected |
| GET | `/posts` | Get all posts | Public |
| GET | `/posts/:id` | Get a post by ID | Public |
| PATCH | `/posts/:id` | Update your post | Protected |
| DELETE | `/posts/:id` | Delete your post | Protected |

### Comments

| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/posts/:postId/comments` | Add a comment | Protected |
| GET | `/posts/:postId/comments` | Get comments for a post | Public |
| PATCH | `/comments/:id` | Update your comment | Protected |
| DELETE | `/comments/:id` | Delete your comment | Protected |

For protected routes, send the JWT in the request header:

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

## Example Requests

### Register a user

`POST /api/v1/auth/register`

```json
{
  "name": "Test User",
  "email": "test@example.com",
  "password": "StrongPassword123"
}
```

### Log in

`POST /api/v1/auth/login`

```json
{
  "email": "test@example.com",
  "password": "StrongPassword123"
}
```

### Create a blog post

`POST /api/v1/posts`

```json
{
  "title": "My First Blog Post",
  "content": "This is the content of my first blog post."
}
```

### Add a comment

`POST /api/v1/posts/POST_ID/comments`

```json
{
  "content": "Great article!"
}
```

For the comment request, replace `POST_ID` with a real post ID.

## Automated Testing

Run the test suite:

```bash
npm test
```

The project includes automated tests for authentication, blog posts, comments, validation, and ownership-based authorization.

**Latest recorded test result:** 24 tests passed, 0 failed.

## Security

- Passwords are hashed before storage.
- JWTs are used to protect private endpoints.
- Users cannot update or delete resources belonging to other users.
- Request data is validated.
- Helmet adds security-related HTTP headers.
- Environment variables are used for sensitive configuration.

## Author

**Md Mazid Hussain**

- GitHub: [mdmaj](https://github.com/mdmaj)
- Portfolio: [mdmaj.in](https://www.mdmaj.in/)

## License

Created as part of the InnoByte RESTful Blog API assignment.
