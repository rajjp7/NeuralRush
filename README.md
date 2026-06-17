# 🧠 NeuralRush

**NeuralRush** is a full-stack, gamified brain training web application built with a stunning Cyberpunk / Neuro-Game aesthetic. Train your mind across six cognitive domains, earn XP, build streaks, and climb the leaderboard.

## 🚀 Features

- **Gamified Training Arena**: Six dedicated cognitive modules:
  - 🧠 **Memory**: Recall sequences & spatial patterns
  - 🎯 **Focus**: Stroop tests & attention filters
  - ⚡ **Speed**: Rapid-fire mental arithmetic
  - 🔮 **Logic**: Sequences & deduction puzzles
  - 💡 **Creativity**: Lateral thinking & riddles
  - 📖 **Language**: Vocabulary & word mastery
- **Procedural Engine**: No hardcoded questions. The backend dynamically generates infinite, cryptographically signed exercises.
- **Immersive HUD**: Neon cyberpunk UI, XP bars, streak counters, and animated combo badges.
- **Brain Profile**: Real-time SVG radar chart mapping your cognitive strengths and calculating your "Human Score".
- **Leaderboards**: Global and weekly ranking system.

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, React, Vanilla CSS Modules (Cyberpunk Design System)
- **Backend**: Node.js, Express, TypeScript
- **Database**: SQLite (via Prisma ORM) - *Zero external DB setup required!*
- **Caching (Optional)**: Redis (for high-performance leaderboards, falls back to DB gracefully if not present)

## 🏁 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/neuralrush.git
cd neuralrush
```

### 2. Backend Setup
```bash
cd neuralrush-backend
npm install

# Generate Prisma Client & Push schema to local SQLite DB
npx prisma generate
npx prisma db push

# Create a .env file based on the example (or use the defaults)
# Example minimal .env:
# PORT=4000
# DATABASE_URL="file:./dev.db"
# JWT_SECRET="your_super_secret_jwt_key_here"
# FRONTEND_URL="http://localhost:3000"

# Start the backend server
npm run dev
```
*The backend will run on `http://localhost:4000`.*

### 3. Frontend Setup
Open a new terminal window:
```bash
cd neuralrush-frontend
npm install

# Start the Next.js development server
npm run dev
```
*The frontend will run on `http://localhost:3000`.*

## 🎮 How to Play
1. Open `http://localhost:3000` in your browser.
2. Create a "Neural Profile" (Register).
3. Head to the **Train** tab and select a module.
4. Answer quickly to build Combos and maximize your XP!
5. Check your **Brain Map** to see your progress across the 6 dimensions.

## 📁 Project Structure
- `/neuralrush-frontend`: Next.js App Router application containing the UI, layout HUD, and API client layer.
- `/neuralrush-backend`: Express API server containing the procedural exercise generator, auth, and Prisma SQLite database configuration.

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the [issues page]

## 📝 License
This project is licensed under the MIT License.
