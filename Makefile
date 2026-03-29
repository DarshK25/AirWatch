# AirWatch Pro - Makefile

.PHONY: help install dev test test-cov lint build docker-up docker-down deploy clean

# Help
help:
	@echo "AirWatch Pro - Available Commands:"
	@echo "================================"
	@echo "make install      - Install all dependencies"
	@echo "make dev          - Start development servers"
	@echo "make test         - Run tests"
	@echo "make test-cov     - Run tests with coverage"
	@echo "make lint         - Run linting"
	@echo "make build        - Build Docker containers"
	@echo "make docker-up    - Start Docker containers"
	@echo "make docker-down  - Stop Docker containers"
	@echo "make deploy       - Deploy to production"
	@echo "make clean        - Clean temporary files"

# Install dependencies
install:
	@echo "Installing backend dependencies..."
	cd fastapi_app && pip install -r requirements.txt
	@echo "Installing frontend dependencies..."
	cd frontend && npm install

# Development
dev:
	@echo "Starting development servers..."
	cd fastapi_app && python run.py &
	cd frontend && npm run dev

# Testing
test:
	@echo "Running tests..."
	cd fastapi_app && pytest ../tests/ -v

test-cov:
	@echo "Running tests with coverage..."
	cd fastapi_app && pytest ../tests/ -v --cov=. --cov-report=html --cov-report=term

# Linting
lint:
	@echo "Running linting..."
	cd frontend && npm run lint || true

# Build Docker
build:
	@echo "Building Docker containers..."
	docker-compose build

# Docker
docker-up:
	@echo "Starting Docker containers..."
	docker-compose up -d

docker-down:
	@echo "Stopping Docker containers..."
	docker-compose down

# Deploy
deploy:
	@echo "Deploying to production..."
	git push origin main

# Clean
clean:
	@echo "Cleaning temporary files..."
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name "node_modules" -exec rm -rf {} + 2>/dev/null || true
	cd frontend && rm -rf dist .vite 2>/dev/null || true
