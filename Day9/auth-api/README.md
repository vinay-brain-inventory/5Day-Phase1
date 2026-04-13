# Day9 - Auth API

## Run

```bash
npm i
npm run dev
```

## Routes

- POST `/api/auth/register`
- POST `/api/auth/login`
- POST `/api/auth/refresh`
- POST `/api/auth/logout`
- GET `/api/me` (Bearer access token)

Refresh token is also set as httpOnly cookie on `/api/auth/refresh`.

