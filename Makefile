.PHONY: help build test smoke deploy destroy clean

help:
	@echo "Targets:"
	@echo "  make build    Build Lambda package into build/lambda/"
	@echo "  make test     Run pytest"
	@echo "  make smoke    Hit the deployed API end-to-end"
	@echo "  make deploy   terraform apply"
	@echo "  make destroy  terraform destroy (careful!)"
	@echo "  make clean    Remove build artifacts"

build:
	cd backend && ./build.sh

test:
	cd backend && . .venv/bin/activate && pytest -v

smoke:
	cd backend && ./smoke-test.sh

deploy:
	cd terraform && terraform apply

destroy:
	cd terraform && terraform destroy

clean:
	rm -rf build/ backend/__pycache__ backend/.pytest_cache
