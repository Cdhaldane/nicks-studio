# Nickola Magnolia Artist Website

A modern, responsive React application for artist Nickola Magnolia featuring music streaming, merchandise shop, and fan engagement.

## 🎵 Features

- **Music Streaming**: Spotify integration with interactive vinyl records
- **E-Commerce**: Shopify integration for merchandise sales
- **Fan Engagement**: Email newsletter signup and social media links
- **Responsive Design**: Mobile-first design with smooth animations
- **Performance Optimized**: Lazy loading, code splitting, and optimized images

## 🚀 Tech Stack

- **Frontend**: React 18, React Router Dom
- **State Management**: Redux Toolkit
- **E-Commerce**: Shopify Hydrogen React
- **Styling**: CSS3 with CSS Variables
- **Animations**: CSS Animations, React Scroll Parallax
- **Music Integration**: Spotify Web API
- **Email Marketing**: MailChimp

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Alert/          # Alert system
│   ├── Banner/         # Announcement banner
│   ├── Cart/           # Shopping cart
│   ├── Footer/         # Site footer
│   ├── MailChimpForm/  # Email signup
│   ├── Modal/          # Modal dialogs
│   ├── Music/          # Music player components
│   ├── Navbar/         # Navigation
│   └── Shop/           # E-commerce components
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
├── contexts/           # React contexts
├── Views/              # Page components
└── reducers/           # Redux reducers
```

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/nicks-studio-shopify.git
   cd nicks-studio-shopify
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

4. **Start development server**
   ```bash
   npm start
   ```

## 🔧 Configuration

### Shopify Setup
1. Create a Shopify store
2. Generate Storefront API credentials
3. Add your store domain and tokens to `.env`

### Spotify Integration
1. Create a Spotify Developer account
2. Register your application
3. Add Client ID and Secret to `.env`

### MailChimp Setup
1. Create a MailChimp account
2. Set up an audience
3. Add your MailChimp URL to `.env`

## 🎯 Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run deploy` - Deploy to GitHub Pages
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## 🌟 Key Features

### Music Integration
- Spotify API integration for displaying albums
- Interactive vinyl record animations
- Embedded music player
- Album artwork display

### E-Commerce
- Shopify integration for product management
- Shopping cart functionality
- Secure checkout process
- Order management

### Performance
- Lazy loading for images
- Code splitting for optimal bundle size
- Responsive images with WebP support
- Optimized CSS and JavaScript

## 📱 Responsive Design

- Mobile-first approach
- Tablet and desktop optimizations
- Touch-friendly interactions
- Optimized for all screen sizes

## 🎨 Design System

- Consistent color palette using CSS variables
- Typography system with web fonts
- Reusable component library
- Smooth animations and transitions

## 📈 Performance Metrics

- Lighthouse Score: 90+
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s
- Cumulative Layout Shift: < 0.1

## 🔒 Security

- Environment variables for sensitive data
- Secure API token management
- Content Security Policy headers
- HTTPS enforcement

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Support

For support, email support@nickolamagnolia.com or join our Discord community.

## 🎵 About Nickola Magnolia

Nickola Magnolia is a Country/Americana artist from the shores of the Great Lakes. Her music intertwines classic Country melodies with intimate Rock and Americana influences.

---

Built with ❤️ by [Your Name]
