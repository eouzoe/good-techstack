# Deploy to Cloudflare Workers via alchemy (injects only the deploy-scoped secrets)
deploy:
    cd init-playground && secretspec run --scope deploy -- bunx alchemy deploy

# Drizzle — push schema changes to the database
db-push:
    cd init-playground && bunx drizzle-kit push

# Drizzle — generate SQL migration from schema changes
db-generate:
    cd init-playground && bunx drizzle-kit generate
