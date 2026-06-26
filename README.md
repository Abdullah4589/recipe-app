# MealPlanner

A cross-platform **React Native / Expo** meal planning app with a **Node.js + Express + MongoDB** backend. Plan your week's meals, save favourites, create custom recipes, and sync everything across devices.

---

## Screenshots

| Login | Home | Weekly Plan |
|-------|------|-------------|
| ![Login](screenshots/login.png) | ![Home](screenshots/home.png) | ![Weekly Plan](screenshots/weekly-plan.png) |

| Recipe Detail | Favourites | My Recipes |
|---------------|------------|------------|
| ![Recipe Detail](screenshots/recipe-detail.png) | ![Favourites](screenshots/favourites.png) | ![My Recipes](screenshots/my-recipes.png) |

> Add your screenshots to the `screenshots/` folder with the filenames above.

---

## Features

- **Weekly Meal Planning** — Auto-generates a 7-day plan (Breakfast, Lunch, Dinner) across your chosen cuisines
- **13 Cuisines** — Pakistani, Indian, Arabic, Italian, Mexican, Mediterranean, Chinese, Japanese, American, Middle Eastern, Thai, French, Greek
- **5 Dietary Preferences** — None, Vegetarian, Vegan, Gluten Free, High Protein
- **Cloud Sync** — Plans and preferences sync to MongoDB so they load on any device
- **Favourites** — Heart any recipe to save it to your personal list
- **Custom Recipes** — Add, edit, and delete your own recipes with ingredients and steps
- **Shuffle** — Swap out any individual meal with one tap
- **5 Themes** — Forest, Ocean, Sunset, Lavender, Slate
- **Offline Fallback** — Stub recipes are shown when network is unavailable
- **Auth** — Email/password registration and login with JWT tokens (30-day sessions)

---

## Tech Stack

### Frontend
| Tool | Purpose |
|------|---------|
| React Native + Expo SDK 54 | Cross-platform mobile app |
| React Navigation (Stack) | Screen navigation |
| AsyncStorage | Local caching |
| TheMealDB API | Free recipe data (no key required) |

### Backend
| Tool | Purpose |
|------|---------|
| Node.js + Express | REST API server |
| MongoDB + Mongoose | Database and ODM |
| bcryptjs | Password hashing |
| jsonwebtoken | JWT auth (30-day tokens) |
| dotenv | Environment variable management |
| nodemon | Dev auto-restart |

---

## Project Structure

```
recipe-app/
├── App.js                    # Root — splash, auth gate, navigation
├── api/
│   ├── backend.js            # All backend API calls (auth, plans, favourites, etc.)
│   └── gemini.js             # TheMealDB integration + hardcoded weekly plans
├── backend/
│   ├── server.js             # Express entry point
│   ├── middleware/auth.js    # JWT verification middleware
│   ├── models/               # Mongoose schemas (User, MealPlan, Favourite, CustomRecipe, Preferences)
│   └── routes/               # Express routers (auth, meal-plan, favourites, custom-recipes, preferences)
├── components/               # Reusable UI (MealCard, DayPill, CuisineChip, etc.)
├── constants/theme.js        # Colours, typography, spacing, cuisine badge colours
├── context/
│   ├── AuthContext.js        # Login/logout state + token persistence
│   └── ThemeContext.js       # Theme switching state
├── screens/
│   ├── AppSplashScreen.js    # Animated splash
│   ├── LoginScreen.js        # Sign in
│   ├── RegisterScreen.js     # Create account
│   ├── HomeScreen.js         # Cuisine + diet selector
│   ├── WeeklyPlanScreen.js   # 7-day meal grid
│   ├── RecipeDetailScreen.js # Full recipe view + favourite button
│   ├── FavouritesScreen.js   # Saved recipes list
│   └── CustomRecipesScreen.js# User's own recipes + add/edit modal
├── utils/storage.js          # AsyncStorage wrappers with cache versioning
└── screenshots/              # App screenshots (add your own)
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- MongoDB Atlas account (free tier is fine)
- Expo Go app on your phone

### 1. Clone the repo

```bash
git clone https://github.com/Abdullah4589/recipe-app.git
cd recipe-app
```

### 2. Set up the backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/mealplanner?retryWrites=true&w=majority
JWT_SECRET=your-long-random-secret-string
PORT=3000
```

Start the backend:

```bash
npm run dev
```

You should see:
```
Server running on port 3000
MongoDB connected
```

### 3. Set up the frontend

```bash
cd ..          # back to recipe-app root
npm install
```

Open `api/backend.js` and replace the IP with your computer's local IP address:

```js
export const BACKEND_URL = 'http://YOUR_LOCAL_IP:3000/api';
```

Find your local IP:
- **Windows**: `ipconfig` → look for IPv4 under Wi-Fi
- **Mac/Linux**: `ifconfig` → look for `inet` under `en0`

Start Expo:

```bash
npx expo start --clear
```

### 4. Open on your phone

- Make sure your phone and PC are on the **same Wi-Fi**
- Scan the QR code in the Expo terminal with the **Expo Go** app
- Register an account → start planning!

---

## Backend API Reference

All protected routes require `Authorization: Bearer <token>` header.

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register with email + password |
| POST | `/api/auth/login` | Login, returns JWT token |

### Meal Plan
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/meal-plan` | Get current user's saved plan |
| POST | `/api/meal-plan` | Save/overwrite the weekly plan |

### Favourites
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/favourites` | List all favourites |
| POST | `/api/favourites` | Add a recipe to favourites |
| DELETE | `/api/favourites/:id` | Remove a favourite |

### Custom Recipes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/custom-recipes` | List user's custom recipes |
| POST | `/api/custom-recipes` | Create a custom recipe |
| PUT | `/api/custom-recipes/:id` | Update a custom recipe |
| DELETE | `/api/custom-recipes/:id` | Delete a custom recipe |

### Preferences
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/preferences` | Get saved cuisines + diet |
| PUT | `/api/preferences` | Save cuisines + diet |

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret key for signing JWT tokens (make it long and random) |
| `PORT` | Port to run the server on (default: 3000) |

> **Never commit `.env` files.** They are in `.gitignore`.

---

## Supported Cuisines

Hardcoded 7-day plans (all 5 dietary preferences) are included for:
- **Pakistani** — Halwa Puri, Nihari, Biryani, Karahi, Haleem, and more
- **Indian** — Aloo Paratha, Dal Makhani, Butter Chicken, Paneer Tikka, and more
- **American** — Pancakes, Caesar Salad, BBQ Burger, Mac & Cheese, and more
- **French** — Croissant, Ratatouille, Croque Monsieur, Boeuf Bourguignon, and more

Other cuisines use live TheMealDB data.

---

## License

MIT
