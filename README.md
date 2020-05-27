# NEXUS UW - Backend

Projects platform between non-profit organizations (NPO) and students.

## Getting Started

Install dependencies.

```sh
npm install
```

Define your environment variables in a `.env` file, in KEY=VALUE format. If deploying to GAE, you can write them in your app.yaml instead.

| ENV                  | Default               | Description                           |
| -------------------- | --------------------- | ------------------------------------- |
| DOMAIN               | localhost             | Domain serving both FE and BE         |
| FE_ADDR              | http://localhost:3000 | Frontend service address              |
| BE_ADDR              | http://localhost:3100 | Backend service address               |
| PORT                 | 3100                  | Port exposed to serve backend         |
| DB_SOCKET            | _null_                | Socket path for unix domain (GCP)     |
| DB_HOST              | localhost             | MySQL hostname                        |
| DB_PORT              | 3306                  | MySQL port                            |
| DB_USER              | root                  | MySQL username                        |
| DB_PASS              | _null_                | MySQL password                        |
| DB_NAME              | _null_                | MySQL database name                   |
| JWT_SECRET           | jwt-secret            | JWT secret key                        |
| EMAIL_ADDR           | _null_                | Mailer email                          |
| EMAIL_ANME           | _null_                | Mailer name                           |
| GOOGLE_CLIENT_ID     | _null_                | Google client ID                      |
| GOOGLE_PROJECT_ID    | _null_                | Google project ID                     |
| GOOGLE_CLIENT_SECRET | _null_                | Google client secret                  |
| GOOGLE_AUTH_CODE     | _null_                | Google one-time auth code (for setup) |
| GOOGLE_ACCESS_TOKEN  | _null_                | Google access token                   |
| GOOGLE_REFRESH_TOKEN | _null_                | Google refresh token                  |
| ALGOLIA_APP_ID       | _null_                | Algolia app ID                        |
| ALGOLIA_API_KEY      | _null_                | Algolia admin PI key                  |

## Development

```sh
npm run dev
```

Pre-commit linting has been automated but will not fix errors.

```sh
# To fix minor style errors
npm run lint:fix

# To lint
npm run lint
```

## Production

```sh
npm run build
npm start
```

## Deployment with Google App Engine

Create your app.yaml for GAE, then run

```sh
npm run deploy
```

## Documentation

Use [apiDoc](https://apidocjs.com/) for in-line API documentation. It's configured to re-build on every save during development, and served in `/documentation`.
