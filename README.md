# ai-agents-test

A full-stack web application with an Angular frontend and an ASP.NET Core Web API backend. This repository serves as the foundation for building and iterating on the project using a clean, structured monorepo layout.

## Tech Stack

- **Frontend:** Angular (latest stable)
- **Backend:** ASP.NET Core Web API (.NET 10)

## Folder Structure

```
/
├── api/    # ASP.NET Core Web API (.NET 10)
└── web/    # Angular application
```

## Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js LTS](https://nodejs.org/)
- [Angular CLI](https://angular.io/cli) (`npm install -g @angular/cli`)

## Local Development

### Backend (API)

```bash
cd api
dotnet run
```

### Frontend (Web)

```bash
cd web
npm install
ng serve
```
