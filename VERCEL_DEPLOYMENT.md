# 🚀 Vercel Deployment Guide for CUTM Result Portal

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Push your code to GitHub
3. **MongoDB Database**: Set up MongoDB Atlas or use external MongoDB service
4. **Redis Database**: Set up Redis Cloud or external Redis service

## Step 1: Prepare Your Repository

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard

1. **Go to [vercel.com](https://vercel.com)** and sign in
2. **Click "New Project"**
3. **Import your GitHub repository**
4. **Configure the project**:
   - Framework Preset: `Next.js`
   - Root Directory: `cutm-portal` (if your repo has multiple folders)
   - Build Command: `npm run build`
   - Output Directory: `.next`

### Option B: Deploy via Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy from your project directory**:
   ```bash
   cd cutm-portal
   vercel
   ```

## Step 3: Configure Environment Variables

In your Vercel dashboard, go to **Project Settings > Environment Variables** and add:

### Required Environment Variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGO_URI` | MongoDB connection string | `mongodb+srv://username:password@cluster.mongodb.net/cutm1` |
| `REDIS_URL` | Redis connection string | `redis://username:password@host:port` |
| `JWT_SECRET` | JWT signing secret | `your-super-secret-jwt-key-change-in-production` |
| `NODE_ENV` | Environment | `production` |

### Optional Environment Variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `EMAIL_USER` | Email for OTP sending | `your-email@gmail.com` |
| `EMAIL_PASS` | Email app password | `your-app-password` |
| `CUSTOM_KEY` | Custom configuration | `your-custom-value` |

## Step 4: Database Setup

### MongoDB Atlas Setup:
1. **Create MongoDB Atlas account** at [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
2. **Create a new cluster**
3. **Create database user** with read/write permissions
4. **Get connection string** and add to `MONGO_URI`
5. **Import your data** to the `cutm1` database

### Redis Cloud Setup:
1. **Create Redis Cloud account** at [redis.com/redis-enterprise-cloud](https://redis.com/redis-enterprise-cloud)
2. **Create a new database**
3. **Get connection string** and add to `REDIS_URL`

## Step 5: Deploy and Test

1. **Redeploy** your project after adding environment variables
2. **Test the deployment**:
   - Visit your Vercel URL
   - Test user registration/login
   - Test result viewing
   - Test admin/teacher features

## Step 6: Custom Domain (Optional)

1. **Go to Project Settings > Domains**
2. **Add your custom domain**
3. **Configure DNS** as instructed by Vercel

## Troubleshooting

### Common Issues:

1. **Build Failures**:
   - Check that all dependencies are in `package.json`
   - Ensure Node.js version compatibility

2. **Database Connection Issues**:
   - Verify MongoDB Atlas IP whitelist includes Vercel IPs
   - Check connection string format

3. **Environment Variables**:
   - Ensure all required variables are set
   - Check for typos in variable names

4. **Function Timeouts**:
   - API routes have 30-second timeout
   - Consider optimizing database queries

### Support:
- **Vercel Documentation**: [vercel.com/docs](https://vercel.com/docs)
- **MongoDB Atlas**: [docs.atlas.mongodb.com](https://docs.atlas.mongodb.com)
- **Redis Cloud**: [docs.redis.com](https://docs.redis.com)

## Security Notes

1. **Change JWT_SECRET** to a strong, unique value
2. **Use strong database passwords**
3. **Enable MongoDB Atlas authentication**
4. **Use HTTPS** (automatically provided by Vercel)
5. **Regular security updates**

## Performance Optimization

1. **Enable Vercel Analytics** for monitoring
2. **Use Vercel Edge Functions** for better performance
3. **Optimize images** with Next.js Image component
4. **Implement caching** strategies

---

🎉 **Your CUTM Result Portal is now live on Vercel!**
