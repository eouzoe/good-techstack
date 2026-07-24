# Deploy to Cloudflare Workers
deploy:
    wrangler deploy

# Drizzle — push schema changes to the database
db-push:
    bunx drizzle-kit push

# Drizzle — generate SQL migration from schema changes
db-generate:
    bunx drizzle-kit generate
