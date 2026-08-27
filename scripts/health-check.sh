#!/bin/bash

# Quick health check script for deployed services

set -e

API_URL="${1:-http://localhost:4000}"
WEB_URL="${2:-http://localhost:3000}"

echo "🏥 MediCare AI - Health Check"
echo "=============================="
echo "API URL: $API_URL"
echo "Web URL: $WEB_URL"
echo ""

# API Health Check
echo -n "Checking API health... "
if RESPONSE=$(curl -s "$API_URL/health"); then
    if echo "$RESPONSE" | grep -q '"status":"ok"'; then
        echo "✓ OK"
        echo "  Response: $RESPONSE"
    else
        echo "✗ FAILED"
        echo "  Response: $RESPONSE"
        exit 1
    fi
else
    echo "✗ FAILED - Cannot reach API"
    exit 1
fi

# API Ready Check
echo -n "Checking API ready... "
if RESPONSE=$(curl -s "$API_URL/ready"); then
    if echo "$RESPONSE" | grep -q '"ready":true'; then
        echo "✓ OK"
    else
        echo "✗ FAILED"
        exit 1
    fi
else
    echo "✗ FAILED - Cannot reach API ready endpoint"
    exit 1
fi

# Web App Health Check
echo -n "Checking Web app... "
if RESPONSE=$(curl -s "$WEB_URL" -I); then
    if echo "$RESPONSE" | grep -q "HTTP/1.1 200\|HTTP/2 200"; then
        echo "✓ OK"
    else
        echo "⚠ Warning - Status not 200"
        echo "$RESPONSE" | head -1
    fi
else
    echo "✗ FAILED - Cannot reach web app"
    exit 1
fi

echo ""
echo "✅ All health checks passed!"
