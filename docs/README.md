# Block.v2 Online 🎮

A modern, full-featured web-based gaming platform built with Firebase, featuring multiple games, user authentication, social features, and a sleek dark theme.

![Block.v2 Online](https://img.shields.io/badge/Block.v2-Online-red?style=for-the-badge)
![Firebase](https://img.shields.io/badge/Firebase-Enabled-orange?style=flat-square)
![Games](https://img.shields.io/badge/Games-4+-blue?style=flat-square)

## 🎯 Features

### 🎮 Games
- **Snake** - Classic snake game with customizable colors and rainbow mode
- **Tetris** - Full Tetris implementation with scoring and high scores
- **Tic-Tac-Toe** - Play against AI with minimax algorithm
- **Breakout** - Brick-breaking game with paddle controls

### 👥 Social Features
- **User Authentication** - Firebase-powered login/signup
- **Friends System** - Add friends, send/receive friend requests
- **Real-time Messaging** - Chat with friends
- **Leaderboards** - Compete for high scores
- **User Profiles** - Track personal stats and achievements

### 🎨 UI/UX
- **Dark Theme** - Modern dark aesthetic with red accents
- **Responsive Design** - Works on desktop and mobile
- **Smooth Animations** - Polished user interactions
- **Tab-based Navigation** - Clean, organized interface

## 🚀 Live Demo

Visit the live application: [Block.v2 Online](https://skineurytb.github.io/Block.v2-ONLINE/)

## 🛠️ Tech Stack

- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **Backend:** Node.js, Express.js
- **Database:** Firebase Firestore
- **Authentication:** Firebase Auth
- **Hosting:** GitHub Pages
- **Games:** Canvas API for 2D rendering

## 📁 Project Structure

```
Block.v2-ONLINE/
├── main.html          # Main application
├── main.js           # Additional JavaScript utilities
├── firebase.js       # Firebase configuration
├── backend/          # Server-side code
│   ├── server.js     # Express server
│   ├── package.json  # Dependencies
│   └── tsconfig.json # TypeScript config
├── .gitignore        # Git ignore rules
└── README.md         # This file
```

## 🎮 How to Play

### Snake
- Use **WASD** or **Arrow Keys** to move
- Eat apples 🍎 to grow and score points
- Avoid hitting walls or yourself
- Customize your snake color!

### Tetris
- **Arrow Keys**: Move left/right, rotate, drop
- Clear lines to score points
- Beat your high score!

### Tic-Tac-Toe
- Click cells to place X or O
- Play against AI opponent
- First to get 3 in a row wins!

### Breakout
- **Mouse/Arrow Keys**: Move paddle
- Break all bricks to win
- Don't let the ball fall!

## 🔧 Setup & Development

### Prerequisites
- Node.js (v14+)
- Git
- Firebase project

### Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Skineurytb/Block.v2-ONLINE.git
   cd Block.v2-ONLINE
   ```

2. **Install backend dependencies:**
   ```bash
   cd backend
   npm install
   ```

3. **Set up Firebase:**
   - Create a Firebase project
   - Enable Authentication and Firestore
   - Copy your Firebase config to `firebase.js`
   - Set up security rules for Firestore

4. **Run the backend:**
   ```bash
   npm start
   ```

5. **Open `main.html` in your browser**

### Deployment

The frontend is deployed on GitHub Pages. The backend would need separate hosting (Heroku, Vercel, etc.).

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests
- Add new games

## 📝 License

This project is open source. Feel free to use and modify.

## 🙏 Acknowledgments

- Built with ❤️ using modern web technologies
- Inspired by classic arcade games
- Firebase for seamless backend integration

---

**Made by Skineurytb** | **Block.v2 Online** 🎮
