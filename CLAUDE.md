# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Linklet is a Next.js 15 application using React 19, TypeScript, and Tailwind CSS v4. This is a fresh Next.js project created with `create-next-app` using the App Router architecture.

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linting
npm run lint
```

The development server runs on http://localhost:3000.

## Architecture & Structure

- **Framework**: Next.js 15 with App Router
- **UI**: React 19 with TypeScript
- **Styling**: Tailwind CSS v4 with inline theme configuration
- **Fonts**: Geist Sans and Geist Mono from next/font/google

### Key Files
- `app/layout.tsx`: Root layout with font configuration and metadata
- `app/page.tsx`: Home page component  
- `app/globals.css`: Global styles with Tailwind import and CSS variables
- `tsconfig.json`: TypeScript configuration with path aliases (`@/*`)

### Styling Approach
- Uses Tailwind CSS v4 with `@theme inline` configuration
- CSS custom properties for theming (light/dark mode support)
- Font variables defined in layout and used via CSS custom properties

## TypeScript Configuration

The project uses strict TypeScript settings with:
- Path aliases: `@/*` maps to project root
- Next.js plugin enabled
- ESNext module resolution