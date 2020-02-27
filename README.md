# NEXUS UW - Backend

Projects platform between non-profit organizations (NPO) and students.

## Getting Started
Install dependencies.
```sh
npm install
```

Define your environment variables in a `.env` file, in KEY=VALUE format.

| ENV | Default | Description |
| --- | ------- | ----------- |
| FE_ADDR | http://localhost:3000 | Frontend service address |
| PORT | 3100 | Port exposed to serve backend |
| DB_SOCKET | _null_ | Socket path for unix domain (GCP) |
| DB_HOST | localhost | MySQL hostname |
| DB_PORT | 3306 | MySQL port |
| DB_USER | root | MySQL username |
| DB_PASS | _null_ | MySQL password |
| DB_NAME | _null_ | MySQL database name |
| JWT_SECRET | jwt-secret | JWT secret key |

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
npm run build
gcloud app deploy
```
