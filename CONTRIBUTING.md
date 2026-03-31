# Contributing to DocQnA

Thank you for your interest in contributing!

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/valc5083/doc-qna-rag`
3. Follow the setup guide in [README.md](./README.md)

## Development Setup

### Prerequisites
- Node.js 20 LTS
- .NET SDK 8.0
- Docker Desktop
- NVIDIA NIM API Key (free at build.nvidia.com)

### Running Locally
```bash
# Start infrastructure
docker-compose up -d

# Start backend
cd DocQnA.API && dotnet run

# Start frontend  
cd doc-qna-client && npm run dev
```

## Running Tests
```bash
# Backend
dotnet test DocQnA.Tests

# Frontend
cd doc-qna-client && npm test
```

## Pull Request Guidelines
- One feature/fix per PR
- Include tests for new features
- Update README if needed
- Follow existing code style