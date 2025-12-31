# SharedInk

SharedInk is a collaborative canvas where users can draw shapes like squares, circles, arrows, and also use a freehand pencil tool.

## Running Locally

### Manual Setup

> [!NOTE]  
> This project uses **pnpm** as the only package manager.  
> [pnpm](https://pnpm.io/)

1. Clone the repository

```bash
git clone https://github.com/purvjoshi04/SharedInk.git
```

2. Navigate to the project directory

```bash
cd SharedInk
```

3. Create environment variables

```bash
cp .env.example .env
```

4. Install dependencies
```bash
pnpm install
```

5. Database Setup

Create a .env file inside the packages/db folder:
```bash
DATABASE_URL="postgresql://postgres:postgres@postgres:5432/postgres"
```

[!NOTE]
> You must have a running PostgreSQL database.
> You can either:

* Use a hosted database like [Neon](https://neon.com/).
* Or run PostgreSQL locally using Docker:
```bash
docker run -d \
  --name postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=postgres \
  -p 5432:5432 \
  postgres:16
```
6. Generate Prisma Client
```bash
pnpm run db:generate
```

7. Run Database Migrations

```bash
pnpm run db:migrate
```

8. Start the development server
```bash
pnpm dev
```
Visit the application at:
```bash
http://localhost:3000/
```

### Instant Docker Setup

1. Navigate to the project directory
```bash
cd SharedInk
```

2. Create database environment variables

Create a .env file inside the packages/db folder:
```bash
DATABASE_URL="postgresql://postgres:postgres@postgres:5432/postgres"
```

3. Start services using Docker Compose
```bash
docker compose up -d
```

4. Visit the application
```bash
http://localhost:3000/
```