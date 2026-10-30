# Nickola Magnolia Artist Website

A modern, responsive React application for artist Nickola Magnolia featuring music streaming, merchandise shop, and fan engagement.

## 🎵 Features

- **Music Streaming**: Spotify integration with interactive vinyl records
- **E-Commerce**: Square integration for merchandise sales
- **Fan Engagement**: Email newsletter signup and social media links
- **Responsive Design**: Mobile-first design with smooth animations
- **Performance Optimized**: Lazy loading, code splitting, and optimized images

## 🚀 Tech Stack

- **Frontend**: React 18, React Router Dom
- **State Management**: Redux Toolkit
- **E-Commerce**: Square (server-side checkout via `/api`)
- **Styling**: CSS3 with CSS Variables
- **Animations**: CSS Animations, React Scroll Parallax
- **Music Integration**: Spotify Web API
- **Email**: Resend — newsletter campaigns, plus order and booking alerts
- **Hosting**: Vercel (static site + serverless functions in `api/`, data in Vercel Blob)

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
   git clone https://github.com/Cdhaldane/nicks-studio.git
   cd nicks-studio
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

### Square Setup
1. Create a Square account and application
2. Copy the access token and location ID from the Square Developer dashboard
3. Add `SQUARE_ACCESS_TOKEN` and `SQUARE_LOCATION_ID` to `.env` (server-side only)

### Spotify Integration
1. Create a Spotify Developer account
2. Register your application
3. Add `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` to `.env` (server-side only — never `REACT_APP_`)

### Newsletter, alerts and data
Every server-side variable (Resend, admin auth, order/booking alerts,
`BLOB_PATH_SECRET`) is documented in `.env.example`.

## 🎯 Available Scripts

- `npm start` - Start development server
- `npm run api` - Run the `api/` functions locally on port 4001
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run test:api` - Run the API test suites (mocked — no real emails, payments or storage)
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

The site is hosted on Vercel — see `VERCEL_DEPLOYMENT.md`.

## 🌟 Key Features

### Music Integration
- Spotify API integration for displaying albums
- Interactive vinyl record animations
- Embedded music player
- Album artwork display

### E-Commerce
- Square integration for product management
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

Nickola Magnolia is an independent Canadian singer-songwriter blending gritty alt-country, retro soul and rock & roll — outlaw soul with a vintage edge.

---

Built with ❤️ by [Your Name]
