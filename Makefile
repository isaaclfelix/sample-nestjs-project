# Local database helpers (GNU Make). Automated e2e uses Testcontainers instead.
.PHONY: db-up db-down db-logs db-migrate db-migrate-deploy db-seed db-reset db-studio

DATABASE_URL ?= postgresql://app:app@localhost:5432/app?schema=public

db-up: ## Start Postgres via Docker Compose
	docker compose up -d db

db-down: ## Stop Compose services (keeps the volume)
	docker compose down

db-logs: ## Tail Postgres logs
	docker compose logs -f db

db-migrate: ## Create/apply migrations in development (prisma migrate dev)
	DATABASE_URL='$(DATABASE_URL)' pnpm exec prisma migrate dev

db-migrate-deploy: ## Apply committed migrations (CI / prod-like)
	DATABASE_URL='$(DATABASE_URL)' pnpm exec prisma migrate deploy

db-seed: ## Run prisma/seed.ts
	DATABASE_URL='$(DATABASE_URL)' pnpm exec prisma db seed

db-reset: ## Reset DB and re-apply migrations (destructive)
	DATABASE_URL='$(DATABASE_URL)' pnpm exec prisma migrate reset --force

db-studio: ## Open Prisma Studio
	DATABASE_URL='$(DATABASE_URL)' pnpm exec prisma studio
