# Deploy to Cloudflare Workers (injects only the deploy-scoped secrets)
deploy:
    secretspec run --scope deploy -- wrangler deploy

# Drizzle — push schema changes to the database
db-push:
    bunx drizzle-kit push

# Drizzle — generate SQL migration from schema changes
db-generate:
    bunx drizzle-kit generate
