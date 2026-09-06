.PHONY: run format

run:
	@echo "Starting App..."
	bun --bun run dev --host --port 5888
	@echo "App Terminated."

format:
	@echo "Starting Format Job..."
	bun run lint:fix && bun run check
	@echo "Fomatting Complete."

genMigrations:
	@echo "Starting migration generation..."
	bun run db:generate
	@echo "Done..."
