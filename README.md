# 📷 Historisnap

Snap into history! A modern Vue.js application that explores random historical events from any year, featuring multimedia content, interactive navigation, and comprehensive testing capabilities.

![Vue.js](https://img.shields.io/badge/Vue.js-3.4-4FC08D?style=flat&logo=vue.js&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=flat&logo=vite&logoColor=white)
![Pinia](https://img.shields.io/badge/Pinia-2.2-FFD859?style=flat&logo=pinia&logoColor=black)
![SCSS](https://img.shields.io/badge/SCSS-1.77-CF649A?style=flat&logo=sass&logoColor=white)

## ✨ Features

### 🎯 Core Functionality
- **Random Historical Events**: Discover fascinating events from any year in history
- **Interactive Timeline**: Navigate through years with an intuitive interface
- **Multimedia Support**: View historical images, audio, and video content
- **Smart Caching**: Efficient API caching for improved performance
- **Responsive Design**: Works seamlessly on desktop and mobile devices

### 🧪 Development Tools
- **Testing Suite** (`/testing`): Comprehensive testing and diagnostics
- **Performance Monitoring**: Real-time API metrics and performance tracking
- **Error Handling**: Robust error handling with detailed diagnostics
- **Hot Module Replacement**: Instant development feedback with Vite

### 🎨 Modern Architecture
- **Vue 3**: Composition API for modern, reactive components
- **Pinia**: Centralized state management
- **Vue Router**: Client-side routing with testing routes
- **SCSS**: Advanced styling with variables and mixins
- **Component-based**: Modular, reusable component architecture

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd historisnap

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:3000` to see the application running!

## 📚 Available Scripts

```bash
# Development
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm run preview      # Preview production build locally

# Testing
npm run test         # Run test suite (when implemented)
npm run lint         # Lint code (when implemented)
```

## 🏗️ Project Structure

```
historisnap/
├── public/                 # Static assets
├── src/
│   ├── assets/            # Images, styles, fonts
│   │   └── styles/        # SCSS stylesheets
│   ├── components/        # Reusable Vue components
│   │   ├── AppHeader.vue
│   │   ├── MediaModal.vue
│   │   └── TestingPanel.vue
│   ├── router/            # Vue Router configuration
│   ├── stores/            # Pinia stores
│   │   └── history.js     # Main application state
│   ├── utils/             # Utility functions
│   │   └── wikipedia-api.js # API integration
│   ├── views/             # Page components
│   │   ├── HomeView.vue
│   │   ├── HistoryExplorer.vue
│   │   └── TestingView.vue
│   ├── App.vue            # Root component
│   └── main.js            # Application entry point
├── index.html             # HTML template
├── vite.config.js         # Vite configuration
└── package.json           # Dependencies and scripts
```

## 🌐 API Integration

The application integrates with the Wikipedia API to fetch historical events:

- **Random Events**: Fetches random historical events for any given year
- **Multimedia Content**: Automatically extracts images, audio, and video
- **CORS Handling**: Smart fallback strategies for cross-origin requests
- **Rate Limiting**: Respectful API usage with built-in rate limiting
- **Caching**: Intelligent caching to minimize API calls

## 🧪 Testing & Development

### Development Mode Features
- **Hot Reload**: Instant feedback on code changes
- **Vue DevTools**: Enhanced debugging capabilities
- **Testing Routes**: Access to `/testing` for comprehensive diagnostics
- **Performance Metrics**: Real-time monitoring of API calls and performance

### Testing Suite (`/testing`)
- **API Testing**: Comprehensive Wikipedia API testing
- **Multimedia Validation**: Image and media URL validation
- **Performance Monitoring**: Track API response times and success rates
- **Error Diagnostics**: Detailed error reporting and handling tests

## 🎨 Styling & Theming

The application uses SCSS with a comprehensive design system:

- **CSS Variables**: Consistent color palette and spacing
- **Responsive Design**: Mobile-first responsive layout
- **Component Scoping**: Scoped styles prevent CSS conflicts
- **Modern Effects**: Backdrop filters, animations, and transitions

## 🚀 Deployment

### Production Build
```bash
npm run build
```
The production build is optimized, minified, and ready for deployment.

### Deployment Options
- **Static Hosting**: Netlify, Vercel, GitHub Pages
- **CDN**: CloudFront, CloudFlare
- **Traditional Hosting**: Any web server (Apache, Nginx)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Wikipedia API**: For providing access to historical data
- **Vue.js Team**: For the excellent framework and ecosystem
- **Vite Team**: For the lightning-fast build tool

## 🔧 Technical Details

### Dependencies
- **Vue 3**: ^3.4.0 - Progressive JavaScript framework
- **Vue Router**: ^4.3.0 - Official router for Vue.js
- **Pinia**: ^2.2.0 - Intuitive state management
- **Vite**: ^5.4.0 - Next generation frontend tooling

### Browser Support
- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile**: iOS Safari 14+, Chrome Mobile 90+

---

**Built with ❤️ using Vue.js and modern web technologies**