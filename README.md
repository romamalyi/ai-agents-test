# Full-Stack App

A full-stack web application built with an Angular frontend and ASP.NET Core Web API backend. This repository serves as the foundation for the project, providing a clean structure for future development.

## Tech Stack

- **Frontend:** Angular (latest stable)
- **Backend:** ASP.NET Core Web API (.NET 10)

## Folder Structure

```
/
├── api/    # ASP.NET Core Web API (.NET 10)
├── web/    # Angular frontend application
└── README.md
```

## Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0)
- [Node.js LTS](https://nodejs.org/)
- [Angular CLI](https://angular.io/cli) — install via `npm install -g @angular/cli`

## Local Development

### Backend (API)

```bash
cd api
dotnet run
```

The API will be available at `https://localhost:5001` (placeholder — update once scaffolded).

### Frontend (Web)

```bash
cd web
npm install
ng serve
```

The app will be available at `http://localhost:4200` (placeholder — update once scaffolded).
