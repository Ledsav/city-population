# PopGlobe: How Big Are Cities?

## Overview

PopGlobe is an interactive web application that explores the fascinating disconnect between perceived and actual city populations. This project visualizes how people estimate city sizes compared to official statistics, revealing our collective biases about urban areas around the world.

[Live Demo](#) | [Video Tour](#)

## Features

- **Interactive 3D Globe**: Explore cities around the world using a beautiful, interactive 3D globe visualization built with Three.js
- **City Population Perception**: Submit your own estimates for city populations and see how they compare to reality
- **Real-time Visualization**: See your estimates compared to both the official population figures and other users' perceptions
- **City Rankings**: View cities ranked by both official and perceived population size
- **Data Persistence**: Firebase integration for storing and retrieving global perception data

## Key Insights Revealed

PopGlobe helps reveal several interesting patterns in how we perceive cities:

- People tend to **overestimate** the population of famous, culturally significant cities
- Cities with strong media presence are typically perceived as larger than they actually are
- Local geography knowledge affects estimation accuracy
- Tourist destinations are frequently overestimated
- Industrial cities are often underestimated

## Technology Stack

- **Frontend**: React, TypeScript
- **3D Visualization**: Three.js
- **Data Storage**: Firebase Firestore
- **State Management**: React Hooks
- **Styling**: CSS Modules with custom animations
- **Icons**: Lucide React

## Project Structure

```
src/
├── components/            # React components
│   ├── CityGlobe/         # 3D globe visualization
│   ├── CityMarkers/       # City marker implementation
│   ├── CityRanking/       # City ranking list component
│   ├── ErrorBoundary/     # Error handling component
│   └── Form/              # Population perception form
├── config/                # Configuration files
├── services/              # Service layer
│   ├── firebase.ts        # Firebase service
│   ├── firebaseInitializer.ts # Database initialization
│   ├── inputSanitizer.ts  # Input validation
│   └── TextureLoader.ts   # 3D texture loading service
├── types/                 # TypeScript type definitions
└── docs/                  # Documentation
```

## Getting Started

### Prerequisites

- Node.js 14+ and npm/yarn
- Firebase account for the database

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/popglobe.git
   cd popglobe
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the root directory with your Firebase configuration:
   ```
   REACT_APP_FIREBASE_API_KEY=your-api-key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your-auth-domain
   REACT_APP_FIREBASE_PROJECT_ID=your-project-id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your-storage-bucket
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
   REACT_APP_FIREBASE_APP_ID=your-app-id
   REACT_APP_FIREBASE_MEASUREMENT_ID=your-measurement-id
   ```

4. Start the development server:
   ```bash
   npm start
   ```

## Deployment

The application can be built for production using:

```bash
npm run build
```

The build artifacts will be stored in the `build/` directory, ready to be deployed to any static hosting service like Firebase Hosting, Netlify, or Vercel.

## Future Enhancements

- User authentication to track individual perception patterns
- Demographic data collection to analyze perception trends
- Time-based analysis showing how perceptions change over time
- Additional city metadata (GDP, land area) for deeper analysis
- Accessibility improvements for screen readers and keyboard navigation
- Mobile app version with AR capabilities

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- City population data sourced from [trusted statistical sources]
- Earth textures provided by [NASA's Visible Earth project]
- 3D globe implementation inspired by [Three.js examples]
- UI/UX design inspiration from [design sources]

---

Created with ❤️ by Ledsav - a project exploring perception, geography, and data visualization