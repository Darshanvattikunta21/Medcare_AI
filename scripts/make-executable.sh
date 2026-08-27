#!/bin/bash

# Make all scripts executable
chmod +x scripts/build-production.sh
chmod +x scripts/deploy-docker.sh
chmod +x scripts/deploy-k8s.sh
chmod +x scripts/validate-production.sh

echo "✓ All deployment scripts are now executable"
