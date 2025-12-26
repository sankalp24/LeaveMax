# LeaveMax - Smart Leave Planning Application

A modern web application for optimizing leave planning by analyzing company holidays and suggesting the best vacation periods.

## Features

- 📅 **Holiday Calendar Management**: Upload PDF holiday calendars or manually select holidays
- 🎯 **Smart Leave Optimization**: AI-powered algorithm to maximize continuous vacation days
- 📊 **Visual Calendar View**: Interactive calendar showing optimized leave suggestions
- 📄 **PDF Parsing**: Automatic extraction of holiday dates from PDF files
- 🎨 **Modern UI**: Beautiful, responsive design built with React and Tailwind CSS

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **date-fns** - Date utilities
- **pdfjs-dist** - PDF parsing
- **Motion** - Animations

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, or pnpm

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deployment

### Deploy to Vercel

This project is configured for easy deployment on Vercel:

1. **Push to GitHub**: Ensure your code is in a GitHub repository

2. **Import to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will automatically detect the Vite configuration

3. **Deploy**: Vercel will automatically:
   - Install dependencies
   - Run the build command (`npm run build`)
   - Deploy to production

The project includes a `vercel.json` configuration file that:
- Sets the build output directory to `dist`
- Configures SPA routing (all routes redirect to `index.html`)
- Sets up proper caching headers for static assets

### Manual Deployment

If you prefer to deploy manually:

```bash
# Build the project
npm run build

# The dist folder contains the production-ready files
# Upload the contents of dist/ to your hosting provider
```

## Project Structure

```
├── src/
│   ├── app/
│   │   ├── components/     # React components
│   │   ├── utils/         # Utility functions (optimizer, PDF parser)
│   │   └── App.tsx        # Main app component
│   ├── styles/            # Global styles
│   └── main.tsx           # Entry point
├── index.html             # HTML template
├── vite.config.ts         # Vite configuration
├── vercel.json            # Vercel deployment config
└── package.json           # Dependencies and scripts
```

## Environment Variables

No environment variables are required for basic functionality. The app runs entirely client-side.

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

Private project - All rights reserved
