#!/bin/bash

# MediCare AI Docker Compose Production Deployment

set -e

echo "🏥 Deploying MediCare AI with Docker Compose"
echo "=============================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Load environment variables
if [ -f .env.production.local ]; then
    export $(cat .env.production.local | grep -v '^#' | xargs)
    echo -e "${GREEN}✓ Loaded production environment${NC}"
else
    echo "Please create .env.production.local first"
    exit 1
fi

# Create data directory
mkdir -p apps/api/data
echo -e "${GREEN}✓ Data directory ready${NC}"

# Build images
echo -e "\n${YELLOW}Building Docker images...${NC}"
docker-compose build

# Start services
echo -e "\n${YELLOW}Starting services...${NC}"
docker-compose up -d

# Wait for services to be ready
echo -e "\n${YELLOW}Waiting for services to be healthy...${NC}"
sleep 5

# Health checks
echo -e "\n${YELLOW}Running health checks...${NC}"

API_HEALTH=$(curl -s http://localhost:4000/health | jq -r '.status')
if [ "$API_HEALTH" = "ok" ]; then
    echo -e "${GREEN}✓ API is healthy${NC}"
else
    echo "⚠ API health check returned: $API_HEALTH"
fi

echo -e "\n${GREEN}✓ Deployment completed!${NC}"
echo ""
echo "Services running:"
echo "  API: http://localhost:4000"
echo "  Web: http://localhost:3000"
echo "  Mobile Dev: http://localhost:19000"
echo ""
echo "View logs: docker-compose logs -f"
echo "Stop services: docker-compose down"
