
#  Script Start Dev: Run Air & cd web && npm run dev (IN PARALLEL)

web-dev: 
	@echo "Starting Web Dev Server"
	@cd web && npm run dev

backend-dev:
	@echo "Starting Backend Dev Server"
	@air

dev:
	@echo "Starting Dev Server"
	@make web-dev & make backend-dev