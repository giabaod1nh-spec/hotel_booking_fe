# Hotel Booking Frontend

React + Vite + TypeScript frontend for the Hotel Booking API.

## Setup

```bash
npm install
```

## Development

1. Start the backend: `cd .. && mvn spring-boot:run` (runs on port 8082)
2. Start the frontend: `npm run dev` (runs on port 5173)

## Environment

Create `.env` file (optional):

```
VITE_API_URL=http://localhost:8082/dev
```

Default API URL is `http://localhost:8082/dev` if not set.

## Auth Flow

- **Login**: POST `/auth/login` with `{ username, password }` → stores `accessToken` and `refreshToken` in localStorage
- **Logout**: POST `/auth/logout` with `{ token }` (access token) → clears tokens
- **Protected routes**: Bearer token sent automatically via `Authorization` header
