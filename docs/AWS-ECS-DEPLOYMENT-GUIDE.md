# AWS ECS Deployment Guide with CodePipeline

Complete guide to deploy Frontend (Next.js) and Backend (Node.js/Express) to AWS ECS using CodePipeline, ECR, Application Load Balancer, and Secrets Manager.

## Architecture Overview

- **Frontend**: Next.js application running on ECS with EC2
- **Backend**: Node.js/Express API running on ECS with EC2
- **Compute**: t3.medium EC2 instances (managed by Auto Scaling Group)
- **Load Balancer**: Application Load Balancer (ALB) routing traffic to both services
- **Container Registry**: Amazon ECR for Docker images
- **CI/CD**: AWS CodePipeline triggered by GitHub commits
- **Environment Variables**: Configured directly in ECS Task Definitions
- **Database**: RDS MySQL (if not already set up)

---

## Prerequisites

- AWS Account with admin access
- GitHub repository: `earnwithsurekha/skaarviecom`
- GitHub Personal Access Token (for CodePipeline)

---

## Phase 1: Create Dockerfiles

### Step 1.1: Create Backend Dockerfile

Create `backend/Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Expose port
EXPOSE 5000

# Start application
CMD ["node", "server.js"]
```

### Step 1.2: Create Frontend Dockerfile

Create `Dockerfile` (root level for Next.js):
```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

### Step 1.3: Update next.config.js

Add to `next.config.js`:
```javascript
module.exports = {
  output: 'standalone',
  // ... rest of your config
}
```

### Step 1.4: Create .dockerignore Files

Create `backend/.dockerignore`:
```
node_modules
npm-debug.log
.env
.env.local
.git
.gitignore
README.md
uploads/*
!uploads/.gitkeep
```

Create `.dockerignore` (root):
```
node_modules
npm-debug.log
.next
.env
.env.local
.git
.gitignore
README.md
backend
docs
```

### Step 1.5: Create buildspec.yml Files

Create `backend/buildspec.yml`:
```yaml
version: 0.2

phases:
  pre_build:
    commands:
      - echo Logging in to Amazon ECR...
      - aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com
      - REPOSITORY_URI=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/skaarvi-backend
      - COMMIT_HASH=$(echo $CODEBUILD_RESOLVED_SOURCE_VERSION | cut -c 1-7)
      - IMAGE_TAG=${COMMIT_HASH:=latest}
  build:
    commands:
      - echo Build started on `date`
      - echo Building the Docker image...
      - cd backend
      - docker build -t $REPOSITORY_URI:latest .
      - docker tag $REPOSITORY_URI:latest $REPOSITORY_URI:$IMAGE_TAG
  post_build:
    commands:
      - echo Build completed on `date`
      - echo Pushing the Docker images...
      - docker push $REPOSITORY_URI:latest
      - docker push $REPOSITORY_URI:$IMAGE_TAG
      - echo Writing image definitions file...
      - printf '[{"name":"skaarvi-backend","imageUri":"%s"}]' $REPOSITORY_URI:$IMAGE_TAG > imagedefinitions.json
artifacts:
  files: 
    - backend/imagedefinitions.json
  discard-paths: yes
```

Create `buildspec.yml` (root for frontend):
```yaml
version: 0.2

phases:
  pre_build:
    commands:
      - echo Logging in to Amazon ECR...
      - aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com
      - REPOSITORY_URI=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/skaarvi-frontend
      - COMMIT_HASH=$(echo $CODEBUILD_RESOLVED_SOURCE_VERSION | cut -c 1-7)
      - IMAGE_TAG=${COMMIT_HASH:=latest}
  build:
    commands:
      - echo Build started on `date`
      - echo Building the Docker image...
      - docker build -t $REPOSITORY_URI:latest .
      - docker tag $REPOSITORY_URI:latest $REPOSITORY_URI:$IMAGE_TAG
  post_build:
    commands:
      - echo Build completed on `date`
      - echo Pushing the Docker images...
      - docker push $REPOSITORY_URI:latest
      - docker push $REPOSITORY_URI:$IMAGE_TAG
      - echo Writing image definitions file...
      - printf '[{"name":"skaarvi-frontend","imageUri":"%s"}]' $REPOSITORY_URI:$IMAGE_TAG > imagedefinitions.json
artifacts:
  files: imagedefinitions.json
```

---

## Phase 2: Prepare Environment Variables

### Step 2.1: Document Your Environment Variables

Prepare your environment variables. You'll add these directly to ECS Task Definitions later.

**Backend Environment Variables:**
```
DB_HOST=skaarvi-db.cxm0emkgszfj.ap-south-1.rds.amazonaws.com
DB_USER=admin
DB_PASSWORD=Skaarvi2026
DB_NAME=skaarvi_db
DB_PORT=3306
JWT_SECRET=your-jwt-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-key-here
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=skaarvi-uploads
SMTP_HOST=email-smtp.ap-south-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=AKIAUB26EX2DMIRWND5J
SMTP_PASS=BPAm0q0PikK2jkNgllwbKnIblu6DRVH35pmpjkbJnmTJ
SMTP_FROM=skaarvitelugudigitalacademy@gmail.com
NODE_ENV=production
PORT=5000
```

**Frontend Environment Variables:**
```
NEXT_PUBLIC_API_URL=http://your-alb-dns/api
NODE_ENV=production
```

⚠️ **Security Note**: Environment variables are visible in the ECS console and task definitions. For production, consider using AWS Secrets Manager instead.

---

## Phase 3: Create ECR Repositories

### Step 3.1: Create Backend ECR Repository

1. **Go to Amazon ECR Console**
   - Navigate to: https://console.aws.amazon.com/ecr/
   - Region: `ap-south-1`

2. **Create Repository**
   - Click **"Create repository"**
   - Visibility: **Private**
   - Repository name: `skaarvi-backend`
   - Tag immutability: **Disabled** (optional)
   - Scan on push: **Enabled** (recommended)
   - Click **"Create repository"**
   - **Copy the Repository URI**

### Step 3.2: Create Frontend ECR Repository

1. **Create Repository**
   - Click **"Create repository"**
   - Visibility: **Private**
   - Repository name: `skaarvi-frontend`
   - Tag immutability: **Disabled**
   - Scan on push: **Enabled**
   - Click **"Create repository"**
   - **Copy the Repository URI**

---

## Phase 4: Create VPC and Networking (if needed)

### Step 4.1: Create or Use Existing VPC

1. **Go to VPC Console**
   - Navigate to: https://console.aws.amazon.com/vpc/

2. **If creating new VPC:**
   - Click **"Create VPC"**
   - Choose: **"VPC and more"**
   - Name: `skaarvi-vpc`
   - IPv4 CIDR: `10.0.0.0/16`
   - Availability Zones: **2**
   - Public subnets: **2**
   - Private subnets: **2**
   - NAT gateways: **1 per AZ** (recommended for production)
   - VPC endpoints: **None** (or add S3 endpoint for better performance)
   - Click **"Create VPC"**

3. **Note down:**
   - VPC ID
   - Public Subnet IDs (for ALB)
   - Private Subnet IDs (for ECS tasks)

---

## Phase 5: Create Application Load Balancer

### Step 5.1: Create Target Groups

1. **Go to EC2 Console → Target Groups**
   - Navigate to: https://console.aws.amazon.com/ec2/v2/home#TargetGroups

2. **Create Backend Target Group**
   - Click **"Create target group"**
   - Target type: **Instances** (for EC2 launch type with bridge networking)
   - Target group name: `skaarvi-backend-tg`
   - Protocol: **HTTP**
   - Port: **5000**
   - VPC: Select your VPC
   - Protocol version: **HTTP1**
   - Health check:
     - Health check path: `/api/health` (create this endpoint in your backend)
     - Healthy threshold: **2**
     - Unhealthy threshold: **3**
     - Timeout: **5 seconds**
     - Interval: **30 seconds**
   - Click **"Next"** → **"Create target group"**

3. **Create Frontend Target Group**
   - Click **"Create target group"**
   - Target type: **Instances** (for EC2 launch type with bridge networking)
   - Target group name: `skaarvi-frontend-tg`
   - Protocol: **HTTP**
   - Port: **3000**
   - VPC: Select your VPC
   - Protocol version: **HTTP1**
   - Health check:
     - Health check path: `/`
     - Healthy threshold: **2**
     - Unhealthy threshold: **3**
     - Timeout: **5 seconds**
     - Interval: **30 seconds**
   - Click **"Next"** → **"Create target group"**

### Step 5.2: Create Application Load Balancer

1. **Go to EC2 Console → Load Balancers**
   - Navigate to: https://console.aws.amazon.com/ec2/v2/home#LoadBalancers

2. **Create Load Balancer**
   - Click **"Create load balancer"**
   - Choose **"Application Load Balancer"**
   - Click **"Create"**

3. **Basic Configuration**
   - Name: `skaarvi-alb`
   - Scheme: **Internet-facing**
   - IP address type: **IPv4**

4. **Network Mapping**
   - VPC: Select your VPC
   - Mappings: Select **2 or more Availability Zones**
   - Select **Public subnets** for each AZ

5. **Security Groups**
   - Click **"Create new security group"**
   - Name: `skaarvi-alb-sg`
   - Description: "Security group for Skaarvi ALB"
   - VPC: Select your VPC
   - Inbound rules:
     - Type: **HTTP**, Port: **80**, Source: **0.0.0.0/0**
     - Type: **HTTPS**, Port: **443**, Source: **0.0.0.0/0** (if using SSL)
   - Click **"Create security group"**
   - Go back and select the security group

6. **Listeners and Routing**
   - **Listener 1: HTTP:80**
     - Default action: Forward to `skaarvi-frontend-tg`
   - Click **"Add listener"**
   - **Listener 2: HTTP:80** (we'll add path-based routing)

7. **Create Load Balancer**
   - Click **"Create load balancer"**
   - **Copy the DNS name** (e.g., `skaarvi-alb-123456789.ap-south-1.elb.amazonaws.com`)

### Step 5.3: Add Listener Rules for Backend

1. **Go to Load Balancer → Listeners**
   - Select your ALB: `skaarvi-alb`
   - Click on **HTTP:80 listener**
   - Click **"View/edit rules"**

2. **Add Rule for Backend API**
   - Click **"+"** (Insert Rule)
   - Click **"Add condition"**
   - Choose: **Path**
   - Value: `/api/*`
   - Click **"Add action"**
   - Choose: **Forward to**
   - Target group: `skaarvi-backend-tg`
   - Click **"Save"**

3. **Rule Priority**
   - Ensure API rule has higher priority (lower number) than default rule
   - Drag to reorder if needed

---

## Phase 6: Create ECS Cluster

### Step 6.1: Create ECS Cluster

1. **Go to ECS Console**
   - Navigate to: https://console.aws.amazon.com/ecs/

2. **Create Cluster**
   - Click **"Clusters"** → **"Create cluster"**
   - Cluster name: `skaarvi-cluster`
   - Infrastructure: **Amazon EC2 instances**
   - Click **"Create"**

---

## Phase 6A: Create Launch Template and Auto Scaling Group

### Step 6A.1: Create Launch Template

1. **Go to EC2 Console** → **Launch Templates**
   - Navigate to: https://console.aws.amazon.com/ec2/v2/home#LaunchTemplates

2. **Create Launch Template**
   - Click **"Create launch template"**
   - **Template name**: `skaarvi-ecs-launch-template`
   - **Template version description**: `ECS optimized instance for Skaarvi`

3. **Application and OS Images (AMI)**
   - Click **"Browse more AMIs"**
   - Search for: `amzn2-ami-ecs-hvm`
   - Select the latest **Amazon ECS-Optimized Amazon Linux 2 AMI**
   - AMI ID example: `ami-0abcdef1234567890`

4. **Instance type**
   - Instance type: **t3.medium** (2 vCPU, 4 GB RAM)

5. **Key pair (login)**
   - Key pair: Create new or select existing (for SSH access if needed)
   - If creating new:
     - Name: `skaarvi-ecs-key`
     - Type: RSA
     - Format: .pem
     - Click **"Create key pair"** and save the file

6. **Network settings**
   - Don't configure here (will configure in Auto Scaling Group)

7. **Storage (volumes)**
   - Volume 1 (Root):
     - Size: **30 GiB**
     - Volume type: **gp3**
     - Delete on termination: **Yes**

8. **Advanced details**
   - IAM instance profile: **ecsInstanceRole** (we'll create this in Phase 7)
   - User data: Paste this script:
   
   ```bash
   #!/bin/bash
   echo ECS_CLUSTER=skaarvi-cluster >> /etc/ecs/ecs.config
   echo ECS_ENABLE_TASK_IAM_ROLE=true >> /etc/ecs/ecs.config
   ```

9. **Click "Create launch template"**

### Step 6A.2: Create Auto Scaling Group

1. **Go to EC2 Console** → **Auto Scaling Groups**
   - Navigate to: https://console.aws.amazon.com/ec2/v2/home#AutoScalingGroups

2. **Create Auto Scaling Group**
   - Click **"Create Auto Scaling group"**

3. **Step 1: Choose launch template**
   - Name: `skaarvi-ecs-asg`
   - Launch template: Select `skaarvi-ecs-launch-template`
   - Click **"Next"**

4. **Step 2: Choose instance launch options**
   - VPC: Select your VPC (`skaarvi_VPC`)
   - Availability Zones and subnets: Select **private subnets**
     - ✅ `private-subnet-1a`
     - ✅ `private-subnet-1b`
   - Click **"Next"**

5. **Step 3: Configure advanced options**
   - Load balancing: **No load balancer** (we'll attach ALB to ECS services directly)
   - Health checks: **EC2**
   - Click **"Next"**

6. **Step 4: Configure group size and scaling**
   - Desired capacity: **1**
   - Minimum capacity: **1**
   - Maximum capacity: **2**
   - Automatic scaling: **No scaling policies** (for now)
   - Click **"Next"**

7. **Step 5: Add notifications** (optional)
   - Skip or add SNS notifications
   - Click **"Next"**

8. **Step 6: Add tags**
   - Add tag:
     - Key: `Name`
     - Value: `skaarvi-ecs-instance`
   - Click **"Next"**

9. **Step 7: Review**
   - Review settings
   - Click **"Create Auto Scaling group"**

**Wait 5-10 minutes** for the EC2 instance to launch and register with the ECS cluster.

### Step 6A.3: Verify EC2 Instance Registered

1. **Go to ECS Console** → **Clusters** → `skaarvi-cluster`
2. Click **"Infrastructure"** tab
3. You should see **1 Container instance** registered
4. If not visible after 10 minutes, check:
   - EC2 instance is running
   - Security group allows outbound HTTPS (port 443)
   - User data script is correct

---

## Phase 7: Create IAM Roles

### Step 7.1: Create ECS Container Instance Role

1. **Go to IAM Console**
   - Navigate to: https://console.aws.amazon.com/iam/

2. **Create Role**
   - Click **"Roles"** → **"Create role"**
   - Trusted entity: **AWS service**
   - Use case: **EC2**
   - Click **"Next"**

3. **Add Permissions**
   - Search and select:
     - `AmazonEC2ContainerServiceforEC2Role`
     - `AmazonSSMManagedInstanceCore` (optional, for Systems Manager access)
   - Click **"Next"**

4. **Name and Create**
   - Role name: `ecsInstanceRole`
   - Click **"Create role"**

### Step 7.2: Create ECS Task Execution Role

1. **Create Role**
   - Click **"Roles"** → **"Create role"**
   - Trusted entity: **AWS service**
   - Use case: **Elastic Container Service** → **Elastic Container Service Task**
   - Click **"Next"**

2. **Add Permissions**
   - Search and select:
     - `AmazonECSTaskExecutionRolePolicy`
     - `AmazonEC2ContainerRegistryReadOnly`
   - Click **"Next"**

3. **Name and Create**
   - Role name: `ecsTaskExecutionRole`
   - Click **"Create role"**

### Step 7.3: Create ECS Task Role (for application permissions)

1. **Create Role**
   - Click **"Roles"** → **"Create role"**
   - Trusted entity: **AWS service**
   - Use case: **Elastic Container Service** → **Elastic Container Service Task**
   - Click **"Next"**

2. **Add Permissions**
   - Search and select:
     - `AmazonS3FullAccess` (or create custom policy for your bucket)
     - `AmazonSESFullAccess` (for email)
   - Click **"Next"**

3. **Name and Create**
   - Role name: `ecsTaskRole`
   - Click **"Create role"**

### Step 7.4: Update Launch Template with Instance Role

1. **Go to EC2 Console** → **Launch Templates**
2. **Select** `skaarvi-ecs-launch-template`
3. Click **"Actions"** → **"Modify template (Create new version)"**
4. **Advanced details**:
   - IAM instance profile: Select **ecsInstanceRole**
5. Click **"Create template version"**
6. Click **"Actions"** → **"Set default version"**
7. Select the new version → Click **"Set as default version"**

---

## Phase 8: Create Task Definitions

### Step 8.1: Create Backend Task Definition

1. **Go to ECS Console → Task Definitions**
   - Click **"Create new task definition"** → **"Create new task definition"**

2. **Configure Task Definition**
   - Task definition family: `skaarvi-backend`
   - Launch type: **EC2**
   - Operating system: **Linux/X86_64**
   - Network mode: **bridge**
   - Task size:
     - Leave empty (not required for EC2 launch type)
   - Task role: `ecsTaskRole`
   - Task execution role: `ecsTaskExecutionRole`

3. **Container Configuration**
   - Click **"Add container"**
   - Container name: `skaarvi-backend`
   - Image URI: `YOUR-ACCOUNT-ID.dkr.ecr.ap-south-1.amazonaws.com/skaarvi-backend:latest`
   - Memory Limits:
     - Memory hard limit: **512** MiB
   - Port mappings:
     - Container port: **5000**
     - Host port: **0** (dynamic port mapping)
     - Protocol: **TCP**
     - Name: `skaarvi-backend-5000-tcp`

4. **Environment Variables from Secrets Manager**
   - Scroll to **"Environment variables"**
   - Click **"Add environment variable"** for each variable
   - **Value type**: Select **"Value"** (not ValueFrom)
   - Add all environment variables:
   
   | Key | Value |
   |-----|-------|
   | DB_HOST | skaarvi-db.cxm0emkgszfj.ap-south-1.rds.amazonaws.com |
   | DB_USER | admin |
   | DB_PASSWORD | Skaarvi2026 |
   | DB_NAME | skaarvi_db |
   | DB_PORT | 3306 |
   | JWT_SECRET | your-jwt-secret-key |
   | JWT_REFRESH_SECRET | your-refresh-secret-key |
   | AWS_REGION | ap-south-1 |
   | AWS_ACCESS_KEY_ID | your-access-key |
   | AWS_SECRET_ACCESS_KEY | your-secret-key |
   | AWS_S3_BUCKET | skaarvi-uploads |
   | SMTP_HOST | email-smtp.ap-south-1.amazonaws.com |
   | SMTP_PORT | 587 |
   | SMTP_USER | AKIAUB26EX2DMIRWND5J |
   | SMTP_PASS | BPAm0q0PikK2jkNgllwbKnIblu6DRVH35pmpjkbJnmTJ |
   | SMTP_FROM | skaarvitelugudigitalacademy@gmail.com |
   | NODE_ENV | production |
   | PORT | 5000 |

5. **Logging**
   - Log configuration: **awslogs**
   - Auto-configure CloudWatch Logs: **Enabled**

6. **Create Task Definition**
   - Click **"Create"**

### Step 8.2: Create Frontend Task Definition

1. **Create New Task Definition**
   - Task definition family: `skaarvi-frontend`
   - Launch type: **EC2**
   - Operating system: **Linux/X86_64**
   - Network mode: **bridge**
   - Task size:
     - Leave empty (not required for EC2 launch type)
   - Task role: `ecsTaskRole`
   - Task execution role: `ecsTaskExecutionRole`

2. **Container Configuration**
   - Container name: `skaarvi-frontend`
   - Image URI: `YOUR-ACCOUNT-ID.dkr.ecr.ap-south-1.amazonaws.com/skaarvi-frontend:latest`
   - Memory Limits:
     - Memory hard limit: **512** MiB
   - Port mappings:
     - Container port: **3000**
     - Host port: **0** (dynamic port mapping)
     - Protocol: **TCP**
     - Name: `skaarvi-frontend-3000-tcp`

3. **Environment Variables**
   - Add environment variables:
   
   | Key | Value |
   |-----|-------|
   | NEXT_PUBLIC_API_URL | http://your-alb-dns/api |
   | NODE_ENV | production |
   
   **Note**: Update `NEXT_PUBLIC_API_URL` with your actual ALB DNS after load balancer is created.

4. **Logging**
   - Log configuration: **awslogs**
   - Auto-configure CloudWatch Logs: **Enabled**

5. **Create Task Definition**
   - Click **"Create"**

---

## Phase 9: Create ECS Services

### Step 9.1: Create Backend Service

1. **Go to ECS Console → Clusters**
   - Click on `skaarvi-cluster`
   - Click **"Services"** tab
   - Click **"Create"**

2. **Environment**
   - Compute options: **Launch type**
   - Launch type: **EC2**

3. **Deployment Configuration**
   - Application type: **Service**
   - Task definition:
     - Family: `skaarvi-backend`
     - Revision: **Latest**
   - Service name: `skaarvi-backend-service`
   - Desired tasks: **2** (for high availability)

4. **Networking**
   - No need to select VPC/subnets (EC2 instances are already in VPC)
   - Security group: Not configured here (EC2 instance security group handles this)

5. **Load Balancing**
   - Load balancer type: **Application Load Balancer**
   - Load balancer: `skaarvi-alb`
   - Listener: **Use an existing listener** → **80:HTTP**
   - Target group: **Use an existing target group** → `skaarvi-backend-tg`
   - Health check grace period: **60** seconds

6. **Service Auto Scaling** (Optional)
   - Enable: **Yes**
   - Minimum tasks: **2**
   - Maximum tasks: **4**
   - Policy name: `cpu-scaling`
   - Metric type: **ECSServiceAverageCPUUtilization**
   - Target value: **70**
   
   **Note**: With EC2, also ensure your Auto Scaling Group can scale to support additional tasks.

7. **Create Service**
   - Click **"Create"**

### Step 9.2: Update EC2 Instance Security Group

1. **Go to EC2 Console** → **Instances**
2. **Select** the ECS instance (skaarvi-ecs-instance)
3. **Security** tab EC2**
   - Task definition: `skaarvi-frontend` (latest)
   - Service name: `skaarvi-frontend-service`
   - Desired tasks: **2**

3. **Networking**
   - No additional configuration needed (using EC2 instances)

4. **Load Balancing**
   - Load balancer: `skaarvi-alb`
   - Listener: **80:HTTP**
   - Target group: `skaarvi-frontend-tg`
   - Health check grace period: **60** seconds

5. **Create Service**
   - Click **"Create"**

### Step 9.4: Verify Services

1. **Go to ECS Cluster** → `skaarvi-cluster`
2. **Services** tab should show:
   - ✅ `skaarvi-backend-service` - Running count: 2/2
   - ✅ `skaarvi-frontend-service` - Running count: 2/2
3. **If tasks are pending:**
   - Check EC2 instance has enough resources (CPU/Memory)
   - May need to increase Auto Scaling Group to 2 instances
   - Check task definitions memory limits (should be ≤ 2048 MiB total per instance)
   - VPC: Select your VPC
   - Subnets: Select **private subnets**
   - Security group:
     - Create new: `skaarvi-frontend-sg`
     - Inbound: **Custom TCP**, Port: **3000**, Source: `skaarvi-alb-sg`
   - Public IP: **Disabled**

4. **Load Balancing**
   - Load balancer: `skaarvi-alb`
   - Listener: **80:HTTP**
   - Target group: `skaarvi-frontend-tg`
   - Health check grace period: **60** seconds

5. **Create Service**
   - Click **"Create"**

---

## Phase 10: Create CodePipeline with CodeBuild

### Step 10.1: Create GitHub Connection

1. **Go to CodePipeline Console**
   - Navigate to: https://console.aws.amazon.com/codesuite/codepipeline/

2. **Create Connection**
   - Click **"Settings"** → **"Connections"**
   - Click **"Create connection"**
   - Provider: **GitHub**
   - Connection name: `github-earnwithsurekha`
   - Click **"Connect to GitHub"**
   - Click **"Authorize AWS Connector for GitHub"**
   - Click **"Connect"**

### Step 10.2: Create Backend Pipeline

1. **Create Pipeline**
   - Click **"Pipelines"** → **"Create pipeline"**
   - Pipeline name: `skaarvi-backend-pipeline`
   - Service role: **New service role**
   - Role name: `AWSCodePipelineServiceRole-backend`
   - Click **"Next"**

2. **Add Source Stage**
   - Source provider: **GitHub (Version 2)**
   - Connection: `github-earnwithsurekha`
   - Repository name: `earnwithsurekha/skaarviecom`
   - Branch name: `main` (or `develop`)
   - Change detection: **Start the pipeline on source code change** (Enabled)
   - Output artifact format: **CodePipeline default**
   - Click **"Next"**

3. **Add Build Stage**
   - Build provider: **AWS CodeBuild**
   - Click **"Create project"**
   
   **New window opens:**
   - Project name: `skaarvi-backend-build`
   - Environment:
     - Environment image: **Managed image**
     - Operating system: **Amazon Linux 2**
     - Runtime: **Standard**
     - Image: **aws/codebuild/amazonlinux2-x86_64-standard:5.0**
     - Image version: **Always use the latest**
     - Environment type: **Linux**
     - Privileged: **✓ Enabled** (required for Docker)
     - Service role: **New service role**
     - Role name: `codebuild-skaarvi-backend-service-role`
   - Buildspec:
     - Build specifications: **Use a buildspec file**
     - Buildspec name: `backend/buildspec.yml`
   - Environment variables (add these):
     - `AWS_DEFAULT_REGION` = `ap-south-1`
     - `AWS_ACCOUNT_ID` = `YOUR-ACCOUNT-ID`
   - Click **"Continue to CodePipeline"**
   
   - Back in pipeline:
   - Build type: **Single build**
   - Click **"Next"**

4. **Add Deploy Stage**
   - Deploy provider: **Amazon ECS**
   - Region: `ap-south-1`
   - Cluster name: `skaarvi-cluster`
   - Service name: `skaarvi-backend-service`
   - Image definitions file: `imagedefinitions.json`
   - Click **"Next"**

5. **Review and Create**
   - Click **"Create pipeline"**

### Step 10.3: Create Frontend Pipeline

1. **Create Pipeline**
   - Pipeline name: `skaarvi-frontend-pipeline`
   - Service role: **New service role**
   - Click **"Next"**

2. **Source Stage**
   - Source provider: **GitHub (Version 2)**
   - Connection: `github-earnwithsurekha`
   - Repository: `earnwithsurekha/skaarviecom`
   - Branch: `main`
   - Change detection: **Enabled**
   - Click **"Next"**

3. **Build Stage**
   - Build provider: **AWS CodeBuild**
   - Click **"Create project"**
   
   **New project:**
   - Project name: `skaarvi-frontend-build`
   - Environment: (same as backend)
     - Managed image
     - Amazon Linux 2
     - Standard runtime
     - Latest image
     - Privileged: **✓ Enabled**
     - New service role
   - Buildspec: **Use a buildspec file**
   - Buildspec name: `buildspec.yml` (root)
   - Environment variables:
     - `AWS_DEFAULT_REGION` = `ap-south-1`
     - `AWS_ACCOUNT_ID` = `YOUR-ACCOUNT-ID`
   - Click **"Continue to CodePipeline"**
   
   - Click **"Next"**

4. **Deploy Stage**
   - Deploy provider: **Amazon ECS**
   - Cluster: `skaarvi-cluster`
   - Service: `skaarvi-frontend-service`
   - Image definitions file: `imagedefinitions.json`
   - Click **"Next"**

5. **Create Pipeline**
   - Click **"Create pipeline"**

### Step 10.4: Update CodeBuild IAM Roles

Both CodeBuild service roles need ECR permissions:

1. **Go to IAM Console → Roles**
2. **For each CodeBuild role** (`codebuild-skaarvi-backend-service-role` and `codebuild-skaarvi-frontend-service-role`):
   - Click on the role
   - Click **"Add permissions"** → **"Attach policies"**
   - Search and select: `AmazonEC2ContainerRegistryPowerUser`
   - Click **"Add permissions"**

---

## Phase 11: Initial Docker Image Push

Before the first pipeline run, you need to push initial images to ECR:

### Step 11.1: Build and Push Backend Image Manually

1. **Open PowerShell in your project directory**

2. **Login to ECR**
   ```powershell
   aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin YOUR-ACCOUNT-ID.dkr.ecr.ap-south-1.amazonaws.com
   ```

3. **Build and Push Backend**
   ```powershell
   cd backend
   docker build -t skaarvi-backend .
   docker tag skaarvi-backend:latest YOUR-ACCOUNT-ID.dkr.ecr.ap-south-1.amazonaws.com/skaarvi-backend:latest
   docker push YOUR-ACCOUNT-ID.dkr.ecr.ap-south-1.amazonaws.com/skaarvi-backend:latest
   cd ..
   ```

4. **Build and Push Frontend**
   ```powershell
   docker build -t skaarvi-frontend .
   docker tag skaarvi-frontend:latest YOUR-ACCOUNT-ID.dkr.ecr.ap-south-1.amazonaws.com/skaarvi-frontend:latest
   docker push YOUR-ACCOUNT-ID.dkr.ecr.ap-south-1.amazonaws.com/skaarvi-frontend:latest
   ```

---

## Phase 12: Add Health Check Endpoint

Add a health check endpoint to your backend for ALB:

### backend/routes/health.js
```javascript
const express = require('express');
const router = express.Router();

router.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

module.exports = router;
```

### Update backend/server.js
```javascript
const healthRouter = require('./routes/health');
app.use('/api', healthRouter);
```

---

## Phase 13: Commit and Deploy

### Step 13.1: Commit All Files

```bash
git add .
git commit -m "Add AWS ECS deployment configuration"
git push origin main
```

### Step 13.2: Monitor Pipeline

1. **Go to CodePipeline Console**
2. **Watch both pipelines execute:**
   - Source → Build → Deploy
3. **Check for errors in CodeBuild logs**
4. **Verify ECS services are running**

---

## Phase 14: Update Frontend Environment Variable

After deployment, update the frontend API URL:

1. **Go to ECS Console** → **Task Definitions** → `skaarvi-frontend`
2. **Create new revision**:
   - Select latest revision
   - Click **"Create new revision"**
3. **Update environment variable**:
   - Find `NEXT_PUBLIC_API_URL`
   - Change value to: `http://skaarvi-alb-123456789.ap-south-1.elb.amazonaws.com/api` (use your actual ALB DNS)
4. **Create revision**
5. **Update ECS Service**:
   - Go to **Cluster** → `skaarvi-cluster` → **Services** → `skaarvi-frontend-service`
   - Click **"Update service"**
   - Select the **new task definition revision**
   - Check **"Force new deployment"**
   - Click **"Update"**

---

## Phase 15: Testing

### Step 15.1: Test Backend API

```bash
curl http://YOUR-ALB-DNS/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-08-02T..."
}
```

### Step 15.2: Test Frontend

Open in browser:
```
http://YOUR-ALB-DNS
```

---

## Phase 16: Set Up Custom Domain (Optional)

### Step 16.1: Get SSL Certificate (ACM)

1. **Go to AWS Certificate Manager**
2. **Request certificate**
   - Domain: `skaarvi.com`, `*.skaarvi.com`
   - Validation: **DNS validation**
3. **Add CNAME records to your domain DNS**

### Step 16.2: Add HTTPS Listener to ALB

1. **Go to ALB → Listeners**
2. **Add listener**
   - Protocol: **HTTPS**
   - Port: **443**
   - Certificate: Select your ACM certificate
   - Default action: Forward to `skaarvi-frontend-tg`
3. **Add rule for backend API**

### Step 16.3: Update Route 53

1. **Create hosted zone** (if needed)
2. **Add A record:**
   - Name: `skaarvi.com`
   - Type: **A - IPv4 address**
   - Alias: **Yes**
   - Alias target: Your ALB

---

## Troubleshooting

### Common Issues

1. **Pipeline fails at Build stage**
   - Check CodeBuild logs in CloudWatch
   - Verify buildspec.yml syntax
   - Ensure Docker daemon is enabled (Privileged mode)

2. **ECS tasks keep failing**
   - Check CloudWatch Logs for container logs
   - Verify Secrets Manager ARNs are correct
   - Check security groups allow traffic

3. **ALB health checks failing**
   - Verify health check path exists
   - Check security groups
   - Ensure container port matches target group port

4. **Cannot pull images from ECR**
   - Verify Task Execution Role has ECR permissions
   - Check ECR repository names match

---

## Cost Optimization Tips

1. **Use Reserved Instances** (1-year term) for EC2 to save 30-40%
2. **Use Spot Instances** for non-production environments (up to 90% savings)
3. **Right-size your EC2 instances** - Start with t3.medium, monitor usage
4. **Enable Container Insights** only when debugging
5. **Use CloudWatch Logs retention policies** (e.g., 7 days)
6. **Scale EC2 Auto Scaling Group** based on actual demand
7. **Consider Savings Plans** for long-term commitments

**Estimated Monthly Costs (EC2):**
- t3.medium (on-demand): ~$30/month
- t3.medium (1-year Reserved): ~$15/month
- RDS db.t3.medium: ~$50/month
- ALB: ~$20/month
- **Total: $65-100/month** (vs ~$128/month with Fargate)

---

## Security Best Practices

1. ⚠️ **Environment variables in ECS** are visible in task definitions (consider Secrets Manager for production)
2. ✅ **Private subnets** for ECS tasks
3. ✅ **Security groups** with least privilege
4. ✅ **Enable VPC Flow Logs**
5. ✅ **Enable ALB access logs**
6. ✅ **Use IAM roles** instead of access keys where possible
7. ✅ **Enable ECR image scanning**
8. ✅ **Use HTTPS** with ACM certificates

---

## Monitoring and Logging

### CloudWatch Dashboards

1. **Go to CloudWatch → Dashboards**
2. **Create dashboard:** `Skaarvi-Production`
3. **Add widgets:**
   - ECS CPU/Memory utilization
   - ALB request count
   - ALB response times
   - ECS running task count

### CloudWatch Alarms

1. **Create alarms for:**
   - High CPU usage (> 80%)
   - High memory usage (> 80%)
   - ALB unhealthy targets
   - ECS service task count (< desired)

---

## Maintenance

### Rolling Back Deployments

1. **Go to ECS → Task Definitions**
2. **Select previous revision**
3. **Update service** to use older revision

### Updating Environment Variables

1. **Go to ECS Console** → **Task Definitions**
2. **Select your task definition** (backend or frontend)
3. **Create new revision**:
   - Select latest revision
   - Click **"Create new revision"**
   - Update environment variables
   - Click **"Create"**
4. **Update ECS Service**:
   - Go to Services → Select your service
   - Click **"Update service"**
   - Select new task definition revision
   - Check **"Force new deployment"**
   - Click **"Update"**

### Scaling

1. **Manual:** Update ECS service desired count
2. **Auto:** Configure auto-scaling policies

---

## Next Steps

1. ☑️ Set up CloudFront for CDN (optional)
2. ☑️ Configure RDS for database
3. ☑️ Set up ElastiCache for Redis (if needed)
4. ☑️ Configure backups
5. ☑️ Set up monitoring and alerts
6. ☑️ Implement blue/green deployments
7. ☑️ Add WAF rules to ALB

---

## Resources

- **ECS Documentation**: https://docs.aws.amazon.com/ecs/
- **CodePipeline Guide**: https://docs.aws.amazon.com/codepipeline/
- **ALB Documentation**: https://docs.aws.amazon.com/elasticloadbalancing/

---

## Support

For issues or questions:
- Check CloudWatch Logs
- Review AWS Support Center
- Consult AWS documentation

---

**Document Version**: 1.0  
**Last Updated**: August 2, 2026  
**Author**: Skaarvi DevOps Team
