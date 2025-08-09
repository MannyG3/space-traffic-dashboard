# 🚀 Deployment Guide

This guide covers how to deploy the Space Traffic Dashboard to various platforms.

## 📋 Prerequisites

- Node.js 18+ installed
- Git installed
- GitHub account
- Vercel account (for hosting)

## 🌐 Vercel Deployment

### 1. GitHub Repository Setup

1. **Create GitHub Repository**
   ```bash
   gh repo create space-traffic-dashboard --public
   ```

2. **Push Code to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin master
   ```

### 2. Vercel Deployment

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy to Vercel**
   ```bash
   vercel --prod
   ```

3. **Configure Environment Variables** (Optional)
   - Go to Vercel Dashboard
   - Navigate to your project
   - Add environment variables:
     - `USE_MOCK_DATA=true`
     - `SATELLITE_UPDATE_INTERVAL=30`
     - `COLLISION_CHECK_INTERVAL=60`

### 3. Custom Domain (Optional)

1. **Add Custom Domain**
   - Go to Vercel Dashboard
   - Navigate to Domains
   - Add your custom domain
   - Configure DNS settings

## 🔧 Local Development

### Start Development Servers

```bash
# Install all dependencies
npm run install-all

# Start both frontend and backend
npm run dev
```

### Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health

## 📊 Production Considerations

### Frontend (React)

- **Build Optimization**: Production builds are automatically optimized
- **Static Assets**: Served from CDN for fast loading
- **Environment Variables**: Configure in Vercel dashboard

### Backend (Node.js)

- **Serverless Functions**: API routes run as serverless functions
- **Database**: Uses in-memory SQLite for Vercel deployment
- **WebSocket**: Real-time updates via Socket.IO

### Performance

- **CDN**: Global content delivery network
- **Caching**: Automatic caching for static assets
- **Compression**: Gzip compression enabled

## 🔄 Continuous Deployment

### Automatic Deployments

- **GitHub Integration**: Automatic deployment on push to master
- **Preview Deployments**: Automatic preview deployments for pull requests
- **Rollback**: Easy rollback to previous deployments

### Manual Deployments

```bash
# Deploy to production
vercel --prod

# Deploy to preview
vercel

# Rollback to previous deployment
vercel --prod --force
```

## 🛠️ Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are installed
   - Check for TypeScript errors

2. **API Errors**
   - Verify environment variables are set
   - Check API endpoint configurations
   - Review server logs

3. **WebSocket Issues**
   - Check CORS configuration
   - Verify Socket.IO client configuration
   - Review network connectivity

### Debug Commands

```bash
# Check Vercel logs
vercel logs [deployment-url]

# Local build test
cd client && npm run build

# Check environment variables
vercel env ls
```

## 📈 Monitoring

### Vercel Analytics

- **Performance**: Monitor page load times
- **Errors**: Track JavaScript errors
- **Usage**: Monitor bandwidth and function calls

### Custom Monitoring

- **Health Checks**: `/api/health` endpoint
- **Logs**: API call logs and error tracking
- **Metrics**: Real-time system statistics

## 🔒 Security

### Environment Variables

- **API Keys**: Store securely in Vercel dashboard
- **Database**: Use environment-specific configurations
- **CORS**: Configure allowed origins

### Best Practices

- **HTTPS**: Automatic SSL certificates
- **Headers**: Security headers configured
- **Validation**: Input validation on all endpoints

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [React Deployment Guide](https://create-react-app.dev/docs/deployment/)
- [Node.js Best Practices](https://nodejs.org/en/docs/guides/)
- [Socket.IO Deployment](https://socket.io/docs/v4/deployment/)

---

**Need help?** Create an issue on GitHub or check the troubleshooting section above.
