#!/bin/bash

# Deployment script for HappyMeter to Google Cloud Run
# This script helps deploy the application manually

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID=${GCP_PROJECT_ID:-""}
REGION=${GCP_REGION:-"europe-west3"}
SERVICE_NAME="happymeter"
CLOUDSQL_INSTANCE_NAME="happymeter-db"

echo -e "${GREEN}HappyMeter Cloud Run Deployment Script${NC}"
echo "========================================"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}Error: gcloud CLI is not installed${NC}"
    echo "Install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if PROJECT_ID is set
if [ -z "$PROJECT_ID" ]; then
    echo -e "${YELLOW}Please enter your GCP Project ID:${NC}"
    read -r PROJECT_ID
fi

echo -e "${GREEN}Using Project ID: ${PROJECT_ID}${NC}"
echo -e "${GREEN}Using Region: ${REGION}${NC}"

# Set the project
gcloud config set project "$PROJECT_ID"

# Build and push the backend image
echo -e "\n${GREEN}Building backend Docker image...${NC}"
docker build --platform linux/amd64 -t "gcr.io/${PROJECT_ID}/${SERVICE_NAME}-backend:latest" ./backend

echo -e "\n${GREEN}Pushing image to Google Container Registry...${NC}"
docker push "gcr.io/${PROJECT_ID}/${SERVICE_NAME}-backend:latest"

# Deploy to Cloud Run
echo -e "\n${GREEN}Deploying to Cloud Run...${NC}"
gcloud run deploy "$SERVICE_NAME" \
  --image="gcr.io/${PROJECT_ID}/${SERVICE_NAME}-backend:latest" \
  --region="$REGION" \
  --platform=managed \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=production" \
  --set-secrets="DATABASE_URL=DATABASE_URL:latest,ADMIN_USERNAME=ADMIN_USERNAME:latest,ADMIN_PASSWORD=ADMIN_PASSWORD:latest" \
  --add-cloudsql-instances="${PROJECT_ID}:${REGION}:${CLOUDSQL_INSTANCE_NAME}" \
  --memory=1Gi \
  --cpu=1 \
  --min-instances=1 \
  --max-instances=10

# Get the service URL
SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" --region="$REGION" --format="value(status.url)")

echo -e "\n${GREEN}Deployment completed successfully!${NC}"
echo -e "${GREEN}Service URL: ${SERVICE_URL}${NC}"
echo -e "\n${YELLOW}Next steps:${NC}"
echo "1. Configure your custom domain (happymeter.besenyei.net) in Cloud Run"
echo "2. Test your application at: $SERVICE_URL"
