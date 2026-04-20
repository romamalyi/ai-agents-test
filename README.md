# Full-Stack Web Application

A full-stack web application built with an Angular frontend and an ASP.NET Core Web API backend. This repository serves as the foundation for a modern, scalable application following clean architecture principles.

## Tech Stack

- **Frontend:** Angular (latest stable)
- **Backend:** ASP.NET Core Web API (.NET 10)

## Folder Structure

```
/
├── api/       # ASP.NET Core Web API (.NET 10)
├── web/       # Angular frontend application
└── README.md
```

## Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0)
- [Node.js LTS](https://nodejs.org/)
- [Angular CLI](https://angular.io/cli) (`npm install -g @angular/cli`)

## Local Development

### Backend (API)

```bash
cd api
dotnet run
```

The API will be available at `https://localhost:5001` (or as configured).

### Frontend (Web)

```bash
cd web
npm install
ng serve
```

The app will be available at `http://localhost:4200`.
