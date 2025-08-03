#!/bin/bash

# Test script for analytics deployment
# Usage: ./scripts/test-deployment.sh <API_URL>

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if API URL is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: API URL not provided${NC}"
    echo "Usage: ./scripts/test-deployment.sh https://your-project.vercel.app"
    exit 1
fi

API_URL="$1/api/analytics"
echo -e "${YELLOW}Testing analytics API at: $API_URL${NC}\n"

# Test 1: Health check
echo -e "${YELLOW}1. Testing health check endpoint...${NC}"
HEALTH_RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{"action": "health"}' | jq -r '.status')

if [ "$HEALTH_RESPONSE" = "healthy" ]; then
    echo -e "${GREEN}✓ Health check passed${NC}\n"
else
    echo -e "${RED}✗ Health check failed${NC}"
    exit 1
fi

# Test 2: Install tracking
echo -e "${YELLOW}2. Testing install tracking...${NC}"
INSTALL_RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "install",
    "data": {
      "fingerprint": "test-deployment-fingerprint-'$(date +%s)'",
      "version": "1.0.0",
      "browser": "chrome"
    }
  }')

if echo "$INSTALL_RESPONSE" | jq -e '.success' > /dev/null; then
    USER_ID=$(echo "$INSTALL_RESPONSE" | jq -r '.user_id')
    echo -e "${GREEN}✓ Install tracking works - User ID: ${USER_ID:0:8}...${NC}\n"
else
    echo -e "${RED}✗ Install tracking failed${NC}"
    echo "$INSTALL_RESPONSE"
    exit 1
fi

# Test 3: Event tracking
echo -e "${YELLOW}3. Testing event tracking...${NC}"
EVENT_RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "event",
    "data": {
      "user_id": "'$USER_ID'",
      "event_type": "test_event",
      "event_data": {
        "test": true,
        "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
      }
    }
  }')

if echo "$EVENT_RESPONSE" | jq -e '.success' > /dev/null; then
    echo -e "${GREEN}✓ Event tracking works${NC}\n"
else
    echo -e "${RED}✗ Event tracking failed${NC}"
    echo "$EVENT_RESPONSE"
    exit 1
fi

# Test 4: Rate limiting
echo -e "${YELLOW}4. Testing rate limiting...${NC}"
RATE_LIMITED=false

for i in {1..10}; do
    RATE_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL" \
      -H "Content-Type: application/json" \
      -d '{
        "action": "email",
        "data": {
          "email": "ratelimit-test-'$i'@example.com",
          "user_id": "'$USER_ID'"
        }
      }')
    
    HTTP_CODE=$(echo "$RATE_RESPONSE" | tail -n1)
    
    if [ "$HTTP_CODE" = "429" ]; then
        RATE_LIMITED=true
        break
    fi
done

if [ "$RATE_LIMITED" = true ]; then
    echo -e "${GREEN}✓ Rate limiting is working${NC}\n"
else
    echo -e "${YELLOW}⚠ Rate limiting might not be configured properly${NC}\n"
fi

# Test 5: Stats endpoint
echo -e "${YELLOW}5. Testing stats endpoint...${NC}"
STATS_RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{"action": "stats"}')

if echo "$STATS_RESPONSE" | jq -e '.data.total_installs' > /dev/null; then
    TOTAL_INSTALLS=$(echo "$STATS_RESPONSE" | jq -r '.data.total_installs')
    ACTIVE_USERS=$(echo "$STATS_RESPONSE" | jq -r '.data.active_users_7d')
    echo -e "${GREEN}✓ Stats endpoint works${NC}"
    echo -e "  Total installs: $TOTAL_INSTALLS"
    echo -e "  Active users (7d): $ACTIVE_USERS\n"
else
    echo -e "${RED}✗ Stats endpoint failed${NC}"
    echo "$STATS_RESPONSE"
fi

# Test 6: CORS headers
echo -e "${YELLOW}6. Testing CORS headers...${NC}"
CORS_HEADERS=$(curl -s -I -X OPTIONS "$API_URL" | grep -i "access-control")

if echo "$CORS_HEADERS" | grep -q "Access-Control-Allow-Origin"; then
    echo -e "${GREEN}✓ CORS headers are properly configured${NC}"
    echo "$CORS_HEADERS"
else
    echo -e "${RED}✗ CORS headers missing${NC}"
fi

echo -e "\n${GREEN}All tests completed!${NC}"
echo -e "${YELLOW}Note: Some tests might show warnings in production due to security features.${NC}"