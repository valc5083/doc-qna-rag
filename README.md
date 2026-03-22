# 🤖 DocQnA — RAG-Based Document Q&A App

> Ask natural language questions over your uploaded PDF documents using AI — powered by Retrieval-Augmented Generation (RAG).

![Status](https://img.shields.io/badge/Status-In%20Development-blue)
![.NET](https://img.shields.io/badge/.NET-8.0-purple)
![React](https://img.shields.io/badge/React-18-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![License](https://img.shields.io/badge/License-MIT-green)

---

## ✨ Features

- 📄 **PDF Upload** — Drag and drop PDF documents for processing
- 🔍 **AI-Powered Q&A** — Ask questions in natural language, get answers grounded in your documents
- 🧠 **RAG Pipeline** — Semantic chunking, vector embeddings, and similarity search
- 💬 **Streaming Responses** — Real-time token-by-token answer rendering
- 📚 **Source Attribution** — See exactly which part of the document answered your question
- 🗂️ **Collection Management** — Organise multiple documents into named collections
- 🔐 **JWT Authentication** — Secure login/register with refresh token rotation
- 🌗 **Clean UI** — Built with React + Material UI styled components

---

## 🖼️ Screenshots

### Login Page
![Login](./screenshots/login.png)

### Register Page
![Register](./screenshots/register.png)

### Dashboard
![Dashboard](./screenshots/dashboard.png)

> 📸 More screenshots will be added as features are completed.

---

## 🏗️ Architecture

```
React (MUI) Frontend  →  ASP.NET Core 8 Web API  →  RAG Pipeline
                                                         ↓
                                              PDF → Chunk → Embed → Qdrant
                                                         ↓
                                              Query → Search → GPT-4o → Answer
```

### Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Material UI |
| Styling | MUI `styled()` utility |
| State Management | Zustand |
| HTTP Client | Axios |
| Backend | ASP.NET Core 8 Web API |
| AI Orchestration | Microsoft Semantic Kernel |
| LLM + Embeddings | OpenAI GPT-4o + text-embedding-ada-002 |
| Vector Database | Qdrant |
| Relational Database | PostgreSQL 16 + EF Core 8 |
| PDF Parsing | PdfPig |
| Auth | JWT Bearer + BCrypt |
| Infrastructure | Docker + Docker Compose |

---

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:

- [Node.js 20 LTS](https://nodejs.org)
- [.NET SDK 8.0](https://dot.net)
- [Docker Desktop](https://docker.com/products/docker-desktop)
- [Git](https://git-scm.com)
- An [OpenAI API Key](https://platform.openai.com/api-keys) with billing enabled

---

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/doc-qna-rag.git
cd doc-qna-rag
```

---

### 2. Start Docker Containers

```bash
docker-compose up -d
```

This starts:
- **PostgreSQL** on `localhost:5432`
- **Qdrant** on `localhost:6333`

Verify both are running:
```bash
docker ps
```

---

### 3. Configure the Backend

Navigate to the API project:
```bash
cd DocQnA.API
```

Create `appsettings.Development.json` (this file is gitignored — never commit it):
```json
{
  "OpenAI": {
    "ApiKey": "sk-your-openai-key-here"
  }
}
```

Verify `appsettings.json` has your JWT config:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=docqna_db;Username=docqna_user;Password=docqna_pass123"
  },
  "Jwt": {
    "SecretKey": "your-generated-secret-key",
    "Issuer": "DocQnA",
    "Audience": "DocQnA",
    "ExpiryMinutes": "60"
  },
  "Qdrant": {
    "Endpoint": "http://localhost:6333",
    "VectorSize": 1536
  }
}
```

---

### 4. Run the Backend

```bash
cd DocQnA.API
dotnet run
```

The API will be available at `http://localhost:5000`
Swagger UI: `http://localhost:5000/swagger`

> EF Core migrations run automatically on startup.

---

### 5. Run the Frontend

Open a new terminal:

```bash
cd doc-qna-client
npm install
npm run dev
```

The app will be available at `http://localhost:5173`

---

## 📁 Project Structure

```
DocQnA/
├── DocQnA.API/                   # ASP.NET Core 8 Backend
│   ├── Controllers/              # Auth, Document, QnA endpoints
│   ├── Services/                 # Business logic
│   ├── Models/                   # EF Core entities
│   ├── DTOs/                     # Request/Response objects
│   ├── Infrastructure/           # DbContext, Migrations
│   ├── Middleware/               # Exception handling
│   └── Program.cs                # App entry point
│
├── doc-qna-client/               # React + TypeScript Frontend
│   └── src/
│       ├── pages/                # LoginPage, RegisterPage, DashboardPage
│       ├── components/
│       │   ├── styles/           # MUI styled() components
│       │   └── ProtectedRoute.tsx
│       ├── api/                  # Axios API clients
│       ├── store/                # Zustand state stores
│       └── types/                # TypeScript interfaces
│
├── docker-compose.yml            # PostgreSQL + Qdrant
└── README.md
```

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, returns JWT tokens |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Invalidate refresh token |

### Documents *(coming soon)*
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/documents/upload` | Upload and ingest PDF |
| GET | `/api/documents` | List user's documents |
| DELETE | `/api/documents/{id}` | Delete document |

### Q&A *(coming soon)*
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/qna/ask` | Ask a question |
| GET | `/api/qna/ask-stream` | Streaming Q&A via SSE |
| GET | `/api/qna/history` | Chat history |

---

## 📅 Development Progress

| Week | Day | Task | Status |
|---|---|---|---|
| 1 | Day 1 | Project setup, Docker, EF Core, PostgreSQL | ✅ Done |
| 1 | Day 2 | JWT Auth API (Register, Login, Refresh, Logout) | ✅ Done |
| 1 | Bonus | React Auth UI (Login, Register, Dashboard) | ✅ Done |
| 1 | Day 3 | Document upload endpoint | ⏳ In Progress |
| 1 | Day 4 | PDF extraction + chunking | 🔲 Pending |
| 1 | Day 5 | Embeddings + Qdrant storage | 🔲 Pending |
| 2 | Day 1 | Q&A service + vector search | 🔲 Pending |
| 2 | Day 2 | LLM integration (GPT-4o) | 🔲 Pending |
| 2 | Day 3 | Streaming SSE endpoint | 🔲 Pending |
| 2 | Day 4 | Chat history | 🔲 Pending |
| 2 | Day 5 | Collections management | 🔲 Pending |
| 3 | Day 1-5 | Full React frontend (Chat UI, Upload, Source viewer) | 🔲 Pending |
| 4 | Day 1-5 | Testing, deployment, portfolio polish | 🔲 Pending |

---

## 🔐 Security Notes

- `appsettings.Development.json` is gitignored — never commit API keys
- Passwords are hashed with BCrypt
- JWT access tokens expire in 60 minutes
- Refresh tokens rotate on every login
- Each user's documents are isolated by `UserId`

---

## 🐳 Docker Services

```yaml
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker logs docqna_postgres
docker logs docqna_qdrant
```

| Service | Port | Dashboard |
|---|---|---|
| PostgreSQL | 5432 | Use DBeaver to connect |
| Qdrant | 6333 | http://localhost:6333/dashboard |

---

## 🤝 About This Project

This is a **portfolio project** built to demonstrate full-stack development with AI integration. It showcases:

- Production-grade ASP.NET Core API design with clean architecture
- RAG (Retrieval-Augmented Generation) pipeline implementation
- Modern React with TypeScript and component-based styling
- Real-world AI integration using Microsoft Semantic Kernel
- DevOps practices with Docker and CI/CD

**Built by:** Aviguhan — Associate Software Engineer (2.2 years experience)  
**Target:** Full-stack / AI-integrated developer roles

---

## 📄 License

This project is licensed under the MIT License.
