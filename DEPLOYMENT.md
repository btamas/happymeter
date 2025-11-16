# HappyMeter Deployment Guide - Google Cloud Run

This guide will help you deploy HappyMeter to Google Cloud Platform using Cloud Run and Cloud SQL.

## Prerequisites

1. **Google Cloud Account** with billing enabled
2. **gcloud CLI** installed ([Download here](https://cloud.google.com/sdk/docs/install))
3. **Docker** installed ([Download here](https://docs.docker.com/get-docker/))
4. **Domain** configured in Cloud DNS

## Architecture

- **Frontend**: Static files served by the backend (or optionally via Cloud Storage/CDN)
- **Backend**: Node.js/Express API on Cloud Run
- **Database**: PostgreSQL on Cloud SQL

## Step-by-Step Deployment

### 1. Set Up Your GCP Project

```bash
# Login to Google Cloud
gcloud auth login

# Create a new project (or use existing)
gcloud projects create happymeter-prod --name="HappyMeter Production"

# Set the project
gcloud config set project happymeter-prod

# Enable required APIs
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  sql-component.googleapis.com \
  sqladmin.googleapis.com \
  secretmanager.googleapis.com \
  containerregistry.googleapis.com

# Set your region (adjust if needed)
gcloud config set run/region europe-west3
```

### 2. Create Cloud SQL PostgreSQL Instance

```bash
# Create the Cloud SQL instance (this takes 5-10 minutes)
# Using db-g1-small (shared-core) for cost optimization
gcloud sql instances create happymeter-db \
  --database-version=POSTGRES_16 \
  --tier=db-g1-small \
  --edition=ENTERPRISE \
  --region=europe-west3 \
  --root-password=YOUR_SECURE_ROOT_PASSWORD

# Create the database
gcloud sql databases create happymeter \
  --instance=happymeter-db

# Create database user
gcloud sql users create happymeter \
  --instance=happymeter-db \
  --password=YOUR_SECURE_DB_PASSWORD

# Get the instance connection name (save this!)
gcloud sql instances describe happymeter-db --format="value(connectionName)"
# Output format: PROJECT_ID:REGION:INSTANCE_NAME
```

**Cost Note**: db-g1-small (shared-core) is ~$25/month. For better performance, consider db-n1-standard-1 (~$50/month).

### 3. Set Up Secrets in Secret Manager

Store sensitive configuration as secrets:

```bash
# Create DATABASE_URL secret
# Format: postgresql://USER:PASSWORD@/DATABASE?host=/cloudsql/CONNECTION_NAME
echo -n "postgresql://happymeter:YOUR_SECURE_DB_PASSWORD@/happymeter?host=/cloudsql/happymeter-prod:europe-west3:happymeter-db" | \
  gcloud secrets create DATABASE_URL --data-file=-

# Create ADMIN_USERNAME secret
echo -n "admin" | gcloud secrets create ADMIN_USERNAME --data-file=-

# Create ADMIN_PASSWORD secret
echo -n "YOUR_SECURE_ADMIN_PASSWORD" | gcloud secrets create ADMIN_PASSWORD --data-file=-

# Grant Cloud Run access to secrets
PROJECT_NUMBER=$(gcloud projects describe happymeter-prod --format="value(projectNumber)")

gcloud secrets add-iam-policy-binding DATABASE_URL \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding ADMIN_USERNAME \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding ADMIN_PASSWORD \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### 4. Configure Docker Authentication

```bash
# Configure Docker to use gcloud as credential helper
gcloud auth configure-docker
```

### 5. Deploy to Cloud Run

**Option A: Using the deployment script (Recommended)**

```bash
# Set your project ID
export GCP_PROJECT_ID=happymeter-prod
export GCP_REGION=europe-west3

# Run the deployment script
./deploy.sh
```

**Option B: Manual deployment**

```bash
# Build and push the Docker image
docker build -t gcr.io/happymeter-prod/happymeter-backend:latest ./backend
docker push gcr.io/happymeter-prod/happymeter-backend:latest

# Deploy to Cloud Run
gcloud run deploy happymeter \
  --image=gcr.io/happymeter-prod/happymeter-backend:latest \
  --region=europe-west3 \
  --platform=managed \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=production,PORT=8080" \
  --set-secrets="DATABASE_URL=DATABASE_URL:latest,ADMIN_USERNAME=ADMIN_USERNAME:latest,ADMIN_PASSWORD=ADMIN_PASSWORD:latest" \
  --add-cloudsql-instances=happymeter-prod:europe-west3:happymeter-db \
  --memory=1Gi \
  --cpu=1 \
  --min-instances=1 \
  --max-instances=10
```

### 6. Run Database Migrations

After the first deployment, you need to run database migrations:

```bash
# Option 1: Connect via Cloud SQL Proxy locally
# Download Cloud SQL Proxy
curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.8.0/cloud-sql-proxy.darwin.amd64
chmod +x cloud-sql-proxy

# Start the proxy (in a separate terminal)
./cloud-sql-proxy happymeter-prod:europe-west3:happymeter-db

# In your backend directory, set DATABASE_URL to use localhost
cd backend
export DATABASE_URL="postgresql://happymeter:YOUR_SECURE_DB_PASSWORD@localhost:5432/happymeter"
npm run db:push

# This will run the migrations from the drizzle folder

# Option 2: Use Cloud Run Job (more advanced)
# Create a migration job that runs on Cloud Run
```

### 7. Configure Custom Domain

```bash
# Add domain mapping to Cloud Run
gcloud run domain-mappings create \
  --service=happymeter \
  --domain=your-domain.com \
  --region=europe-west3

# This will provide DNS records to add to your domain
# Follow the instructions to add the DNS records in Cloud DNS
```

**DNS Configuration in Cloud DNS:**

1. Go to Cloud DNS console: https://console.cloud.google.com/net-services/dns
2. Select your domain zone
3. Add the DNS records shown by the previous command (typically CNAME records)
4. Wait for DNS propagation (5-30 minutes)
5. Cloud Run will automatically provision SSL certificates

### 8. Verify Deployment

```bash
# Get the Cloud Run service URL
gcloud run services describe happymeter \
  --region=europe-west3 \
  --format="value(status.url)"

# Test the API
curl https://YOUR-SERVICE-URL/api/health
curl https://YOUR-SERVICE-URL/api/docs

# Once DNS propagates, test your custom domain
curl https://your-domain.com/api/health
```

### 9. Set Up CI/CD with Cloud Build (Optional)

Connect your GitHub repository for automated deployments:

```bash
# Connect GitHub repository
gcloud builds triggers create github \
  --repo-name=happymeter \
  --repo-owner=YOUR_GITHUB_USERNAME \
  --branch-pattern="^main$" \
  --build-config=cloudbuild.yaml

# Grant Cloud Build permissions
gcloud projects add-iam-policy-binding happymeter-prod \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud iam service-accounts add-iam-policy-binding \
  ${PROJECT_NUMBER}-compute@developer.gserviceaccount.com \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"
```

Now every push to the `main` branch will automatically deploy to Cloud Run!

## Cost Estimation

**Monthly costs for low/medium traffic:**

- Cloud Run: $0-5 (pay per use, scales to zero)
- Cloud SQL (db-g1-small): ~$25
- Networking: $1-2
- Secret Manager: $0.06/secret
- **Total: ~$30-35/month**

**For higher traffic:**

- Consider Cloud SQL db-n1-standard-1 (~$50/month)
- Cloud Run costs scale with usage
- **Total: ~$55-70/month**

## Monitoring and Logs

```bash
# View Cloud Run logs
gcloud run services logs read happymeter --region=europe-west3 --limit=50

# Follow logs in real-time
gcloud run services logs tail happymeter --region=europe-west3

# View Cloud SQL logs
gcloud sql operations list --instance=happymeter-db

# Open Cloud Console monitoring
gcloud console
```

## Updating the Application

```bash
# Just run the deploy script again
./deploy.sh

# Or use Cloud Build trigger (if set up)
git push origin main
```

## Rollback

```bash
# List revisions
gcloud run revisions list --service=happymeter --region=europe-west3

# Rollback to a previous revision
gcloud run services update-traffic happymeter \
  --to-revisions=happymeter-00001-xyz=100 \
  --region=europe-west3
```

## Troubleshooting

### Service won't start

```bash
# Check logs
gcloud run services logs read happymeter --region=europe-west3 --limit=100

# Common issues:
# - Database connection: Check DATABASE_URL secret
# - Cloud SQL connection: Verify --add-cloudsql-instances flag
# - Secrets: Ensure service account has secretAccessor role
```

### Database connection fails

```bash
# Test Cloud SQL connectivity
gcloud sql connect happymeter-db --user=happymeter

# Check instance is running
gcloud sql instances describe happymeter-db
```

### Custom domain not working

```bash
# Check domain mapping status
gcloud run domain-mappings describe \
  --domain=your-domain.com \
  --region=europe-west3

# Verify DNS records
dig your-domain.com
```

## Security Best Practices

1. **Rotate secrets regularly** using Secret Manager
2. **Enable Cloud Armor** for DDoS protection (if needed)
3. **Review IAM permissions** regularly
4. **Enable Cloud SQL automatic backups**
5. **Set up Cloud Monitoring alerts** for errors and high costs
6. **Use VPC Service Controls** for additional security (advanced)

## Backup and Disaster Recovery

```bash
# Create on-demand backup
gcloud sql backups create --instance=happymeter-db

# List backups
gcloud sql backups list --instance=happymeter-db

# Restore from backup
gcloud sql backups restore BACKUP_ID --backup-instance=happymeter-db
```

## Support and Resources

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Cloud SQL Documentation](https://cloud.google.com/sql/docs)
- [GCP Pricing Calculator](https://cloud.google.com/products/calculator)
- [GCP Free Tier](https://cloud.google.com/free)

## Next Steps

After deployment:

1. Test all API endpoints at your custom domain's `/api/docs` endpoint
2. Set up monitoring and alerts in Cloud Console
3. Configure automatic backups for Cloud SQL
4. Set up a staging environment (optional)
5. Review and optimize costs in the billing dashboard
