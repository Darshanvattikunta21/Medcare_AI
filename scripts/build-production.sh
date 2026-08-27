#!/bin/bash

# MediCare AI Production Build and Deployment Script

set -e

echo "🏥 MediCare AI - Production Build"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js and pnpm
echo -e "${YELLOW}Checking prerequisites...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is not installed${NC}"
    exit 1
fi

if ! command -v pnpm &> /dev/null; then
    echo -e "${RED}pnpm is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js $(node --version)${NC}"
echo -e "${GREEN}✓ pnpm $(pnpm --version)${NC}"

# Install dependencies
echo -e "\n${YELLOW}Installing dependencies...${NC}"
pnpm install --frozen-lockfile

# Typecheck all packages
echo -e "\n${YELLOW}Running type checks...${NC}"
pnpm typecheck

# Build all packages
echo -e "\n${YELLOW}Building packages...${NC}"
pnpm build

# Build API
echo -e "\n${YELLOW}Building API...${NC}"
pnpm --filter api build

# Build Web
echo -e "\n${YELLOW}Building Web App...${NC}"
pnpm --filter web build

# Build Docker images
echo -e "\n${YELLOW}Building Docker images...${NC}"

docker build -t medicareai-api:latest -t medicareai-api:$(date +%s) .
docker build -f Dockerfile.web -t medicareai-web:latest -t medicareai-web:$(date +%s) .

echo -e "\n${GREEN}✓ Docker images built successfully${NC}"

# Show image sizes
echo -e "\n${YELLOW}Docker image sizes:${NC}"
docker images | grep medicareai

echo -e "\n${GREEN}✓ Production build completed successfully!${NC}"
echo ""
echo "Next steps:"
echo "1. Push images to registry: docker push medicareai-api:latest"
echo "2. Deploy to your infrastructure"
echo "3. Run health checks: curl https://api.medicareai.com/health"
