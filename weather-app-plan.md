# Clima — Project Plan

## 1. Project Goal

Build a polished, responsive weather web application called **Clima** that demonstrates strong frontend fundamentals, API integration, asynchronous data handling, responsive UI, and clean error/loading states.

The app should feel like a real product rather than a tutorial project.

### Portfolio purpose

This project should demonstrate:

- React + TypeScript fundamentals
- Working with a third-party REST API
- Async data fetching
- Search and user input handling
- State management
- Responsive UI design
- Loading, empty, and error states
- Reusable components
- Clean Git/GitHub practices
- Production deployment

---

## 2. Core User Experience

A user should be able to:

1. Open the app and immediately see a useful weather interface.
2. Search for a city.
3. See the current weather for that location.
4. See a short forecast.
5. See useful weather details such as temperature, humidity, wind, and precipitation.
6. Understand weather conditions quickly through clear visual hierarchy.
7. Recover gracefully when a city cannot be found or the API fails.
8. Use the application comfortably on desktop and mobile.

---

## 3. Recommended Stack

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS

### API

Use a free weather API with:

- Current weather
- Forecast data
- City/location search
- HTTPS
- A free development tier

Recommended option: **Open-Meteo** if its available data fits the final design. It avoids exposing an API key in a frontend-only project.

### Deployment

- Vercel or another free static/frontend hosting provider

---

## 4. MVP Features

The first version should contain only the features necessary to make the project complete.

### Search

- Search by city name
- Search button
- Enter key submits search
- Prevent empty searches
- Clear feedback for invalid locations

### Current Weather

Display:

- City and country/region
- Current temperature
- Weather condition
- Weather icon
- Feels-like temperature
- Humidity
- Wind speed
- Visibility or precipitation when available

### Forecast

Display a short forecast with:

- Day/date
- Weather condition
- High temperature
- Low temperature
- Weather icon

### States

Implement:

- Initial/empty state
- Loading state
- Successful state
- City-not-found state
- API/network error state

---

## 5. Nice-to-Have Features

Only add these after the MVP works correctly.

### Location

- "Use my location"
- Browser geolocation
- Automatically show local weather

### Unit Toggle

- Celsius / Fahrenheit
- Persist the user's preference locally

### Recent Searches

- Store recent cities in localStorage
- Allow the user to quickly reopen a previous location

### Additional Weather Data

Potentially add:

- Sunrise/sunset
- UV index
- Precipitation probability
- Visibility
- Pressure

Do not add data simply to make the dashboard look busy. Every displayed metric should be useful.

---

## 6. UI / Design Direction

### Overall style

Aim for:

- Minimal
- Modern
- Premium
- Clean
- Easy to scan
- Mobile-first
- Strong typography
- Generous spacing
- Subtle animations

Avoid:

- Excessive gradients
- Giant decorative weather illustrations
- Too many cards
- Excessive glassmorphism
- Generic AI-generated dashboard styling
- Information overload

### Main layout

Suggested structure:

```text
------------------------------------------------
                 Weather App
          Search for a city...
------------------------------------------------

             Manila, Philippines
                 28°C
             Partly Cloudy

        Feels like 30°  |  Humidity 72%
        Wind 12 km/h    |  Rain 20%

------------------------------------------------
              7-Day Forecast

   Mon       Tue       Wed       Thu       Fri
   ☀️        🌧️        ☁️        ☀️        🌦️
   31°       29°       30°       32°       31°
   25°       24°       25°       26°       25°

------------------------------------------------
```

The actual design can differ, but the hierarchy should remain simple.

---

## 7. Component Structure

Keep components reasonably small and reusable.

Possible structure:

```text
src/
├── components/
│   ├── SearchBar.tsx
│   ├── CurrentWeather.tsx
│   ├── WeatherDetails.tsx
│   ├── Forecast.tsx
│   ├── ForecastCard.tsx
│   ├── LoadingState.tsx
│   └── ErrorState.tsx
│
├── hooks/
│   └── useWeather.ts
│
├── lib/
│   ├── weatherApi.ts
│   └── weatherUtils.ts
│
├── types/
│   └── weather.ts
│
├── App.tsx
└── main.tsx
```

Do not force this exact structure if the implementation becomes unnecessarily complicated.

---

## 8. Data Flow

The basic flow should be:

```text
User enters city
       ↓
Search / submit
       ↓
Geocoding request
       ↓
Get coordinates
       ↓
Weather API request
       ↓
Normalize API response
       ↓
Store weather state
       ↓
Render current weather + forecast
```

Keep API-specific response handling outside the UI components where practical.

---

## 9. API Handling

The application should not directly scatter API requests throughout components.

Create a small API layer responsible for:

- Location lookup
- Weather lookup
- Response parsing
- Error handling
- Converting API data into application-friendly types

The UI should work with clean application data rather than raw API response objects.

---

## 10. Accessibility

Include:

- Semantic HTML
- Proper labels for search input
- Keyboard-accessible controls
- Visible focus states
- Good text contrast
- Meaningful alt text where images are used
- `aria-live` for important loading/error feedback when appropriate
- Reduced-motion consideration for animations

---

## 11. Responsive Behavior

### Mobile

- Single-column layout
- Comfortable search controls
- Forecast cards that remain readable
- No horizontal overflow
- Touch-friendly buttons

### Desktop

- Centered content with a sensible max width
- Current-weather section given visual priority
- Forecast displayed horizontally
- Efficient use of available space

Test at multiple widths rather than designing only for the desktop screenshot.

---

## 12. Testing Checklist

Before calling the project complete, test:

### Search

- [ ] Valid city
- [ ] Invalid city
- [ ] Empty search
- [ ] Enter key
- [ ] Repeated searches
- [ ] Cities with spaces
- [ ] Unusual city names

### Network

- [ ] Slow response
- [ ] API failure
- [ ] No internet
- [ ] Unexpected API response

### UI

- [ ] Loading state appears correctly
- [ ] Error state is understandable
- [ ] Mobile layout
- [ ] Desktop layout
- [ ] Keyboard navigation
- [ ] No horizontal overflow

### Data

- [ ] Temperature displays correctly
- [ ] Forecast dates are correct
- [ ] Weather conditions map correctly
- [ ] Units are consistent
- [ ] Missing optional data does not break the UI

---

## 13. Portfolio Quality Requirements

Before adding the project to the portfolio:

- [ ] App is deployed
- [ ] Live demo works without developer intervention
- [ ] GitHub repository is public
- [ ] README explains the project
- [ ] README includes screenshots
- [ ] README lists the tech stack
- [ ] README explains how to run locally
- [ ] Environment variables are documented if any are used
- [ ] No API keys or secrets are committed
- [ ] No obvious console errors
- [ ] Mobile layout is polished
- [ ] Error/loading states are implemented
- [ ] Git history contains meaningful commits

---

## 14. Git Workflow

Use small, meaningful commits.

Suggested milestones:

```text
chore: initialize weather app
feat: build weather search interface
feat: integrate location search
feat: integrate current weather data
feat: add weather forecast
feat: add loading and error states
feat: add responsive layout
feat: add location detection
feat: add unit preferences
fix: handle invalid weather responses
docs: add project README
chore: prepare production deployment
```

Do not make fake commits just to increase the contribution graph. Each commit should represent a real change.

Push regularly after stable milestones.

---

## 15. Definition of Done

Clima is finished when:

1. A user can search for a city.
2. The app retrieves and displays accurate weather data.
3. A forecast is available.
4. Loading and error states work.
5. The interface is responsive.
6. The application is accessible with keyboard navigation.
7. The code is organized and understandable.
8. The project is deployed.
9. The GitHub repository is clean and documented.
10. The project looks good enough to be shown to a recruiter or client.

---

## 16. Build Order

### Phase 1 — Foundation

- Initialize project
- Configure TypeScript
- Configure Tailwind
- Create basic layout
- Create Git repository
- Make first meaningful commit

### Phase 2 — Search

- Build search UI
- Add city input
- Connect location/geocoding API
- Handle invalid locations

### Phase 3 — Weather

- Connect weather API
- Display current weather
- Add weather condition mapping
- Add weather details

### Phase 4 — Forecast

- Add forecast API data
- Create reusable forecast cards
- Format dates
- Handle missing forecast data

### Phase 5 — UX Polish

- Loading state
- Error state
- Empty state
- Responsive behavior
- Accessibility
- Subtle animations

### Phase 6 — Optional Features

Only if the core application is already stable:

- Current location
- Celsius/Fahrenheit toggle
- Recent searches
- Additional weather metrics

### Phase 7 — Production

- Test production build
- Fix warnings/errors
- Deploy
- Test live version
- Clean README
- Add screenshots
- Add live demo link
- Add project to portfolio

---

## 17. Portfolio Presentation

### Project name

**Clima**

### Short description

> A minimal weather experience providing real-time conditions and forecasts through a clean, responsive interface.

### Repository name

`clima`

---

## 18. Success Criteria

The project should communicate three things to a recruiter:

> **I can build a clean frontend.**

> **I can integrate and work with external APIs.**

> **I can turn raw data into a useful user experience.**

The Weather App does not need to be the most technically complex project in the portfolio. Its job is to be a **small, polished, reliable project that proves fundamentals**.
