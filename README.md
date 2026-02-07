# LearnSphere LMS 🚀

LearnSphere is a modern, production-grade eLearning platform built as a **professional monorepo**. It empowers instructors with advanced course management tools and provides learners with an interactive, gamified platform.

## 🏗️ Architecture (Monorepo)

This project follows a professional monorepo structure for scalability and maintainability:

- **`apps/client`**: Vite-powered React frontend with a premium shadcn/ui design system.
- **`apps/server`**: Node.js Express backend with a **clean layered architecture**:
  - `Routes` → `Controllers` → `Services` → `Prisma`
  - Specialized `Agents` for AI logic.
- **`shared`**: Centralized constants and types used by both frontend and backend.

## ✨ Core Features

- **Advanced Course Management**: Full CRUD with visibility rules (Everyone/Signed-in) and access rules (Open/Invite/Paid).
- **Gamified Learning**: Points, badges, and progress tracking for lessons and quizzes.
- **AI-Powered Insights**: Integrated AI agents for lesson explanations and review summaries.
- **Secure Auth**: Robust JWT-based authentication with RBAC (Admin/Instructor/Learner) and Google OAuth support.

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion.
- **Backend**: Express, Prisma, SQLite, Zod.
- **AI**: Gemini Pro (via dedicated agents).

## 🚀 Getting Started

### Prerequisites
- Node.js (v20+ recommended)
- npm

### Installation

1. **Clone and Install**:
   ```sh
   npm install
   ```

2. **Initialize Database**:
   ```sh
   npm run db:generate
   npm run db:push
   npm run db:seed
   ```

3. **Start Development**:
   ```sh
   # Run both frontend and backend concurrently
   npm run dev
   ```

## ⚖️ License
MIT

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