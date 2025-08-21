# Core Engine + Next.js 14+ Application

A modern, framework-agnostic TypeScript core engine powering a Next.js 14+ web application with App Router.

## 🏗️ Architecture

- **Core Engine**: TypeScript module system with lifecycle management
- **Web App**: Next.js 14+ with App Router and TypeScript
- **Styling**: Tailwind CSS with custom components
- **Deployment**: Vercel with automatic builds and CDN
- **CI/CD**: GitHub Actions for automated deployment

## 🚀 Features

### Core Engine
- **Modular Architecture**: Pluggable modules with lifecycle management
- **Event System**: Built-in event emitter for module communication
- **Type Safety**: Full TypeScript support with strict typing
- **Logging**: Structured logging with configurable levels
- **Validation**: Data validation utilities
- **Framework Agnostic**: Can be used with any JavaScript/TypeScript framework

### Web Application
- **Next.js 14+**: Latest features with App Router
- **Real-time Engine Control**: Start/stop engine and manage modules
- **Interactive UI**: Modern, responsive interface with Tailwind CSS
- **API Routes**: RESTful API endpoints for engine interaction
- **Type Safety**: Full TypeScript integration

## 📁 Project Structure

```
├── packages/
│   └── core-engine/          # TypeScript core engine
│       ├── src/
│       │   ├── core/         # Core classes (Engine, Module, EventEmitter)
│       │   ├── utils/        # Utility classes (Logger, Validator)
│       │   └── types/        # TypeScript type definitions
│       ├── package.json
│       └── tsconfig.json
├── apps/
│   └── web-app/              # Next.js 14+ application
│       ├── src/
│       │   ├── app/          # App Router pages and API routes
│       │   └── components/   # React components
│       ├── package.json
│       ├── next.config.js
│       └── tailwind.config.js
├── .github/workflows/        # GitHub Actions CI/CD
├── vercel.json              # Vercel deployment configuration
└── package.json             # Root workspace configuration
```

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+ 
- npm 8+

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd core-engine-nextjs-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the core engine**
   ```bash
   npm run build --workspace=packages/core-engine
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Available Scripts

- `npm run dev` - Start Next.js development server
- `npm run build` - Build all packages and Next.js app
- `npm run test` - Run tests across all packages
- `npm run lint` - Lint all packages
- `npm run type-check` - Type check all packages

## 🔧 Core Engine Usage

### Basic Engine Setup

```typescript
import { Engine, Module } from '@core-engine/core'

// Create an engine
const engine = new Engine({
  name: 'My Engine',
  version: '1.0.0',
  debug: true
})

// Create and register a module
class MyModule extends Module {
  constructor() {
    super({
      id: 'my-module',
      name: 'My Module',
      version: '1.0.0'
    })
  }

  protected async onInitialize(): Promise<void> {
    // Module initialization logic
  }

  protected async onDestroy(): Promise<void> {
    // Module cleanup logic
  }
}

const module = new MyModule()
engine.registerModule(module)

// Start the engine
await engine.start()
```

### Event Handling

```typescript
// Listen to engine events
engine.on('module:registered', (module) => {
  console.log(`Module registered: ${module.name}`)
})

engine.on('engine:started', () => {
  console.log('Engine started successfully')
})
```

## 🌐 Web Application

### Pages

- **Home** (`/`): Engine demonstration and control
- **Engine** (`/engine`): Advanced engine management
- **API** (`/api`): RESTful API endpoints

### API Endpoints

- `GET /api/engine` - Get engine status and module data
- `POST /api/engine` - Add data to engine modules
- `DELETE /api/engine?id=<id>` - Remove data from engine modules

## 🚀 Deployment

### Vercel Deployment

1. **Connect your GitHub repository to Vercel**
2. **Set environment variables**:
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`
3. **Push to main branch** - Automatic deployment will trigger

### Manual Deployment

```bash
# Build the project
npm run build

# Deploy to Vercel
vercel --prod
```

## 🔒 Environment Variables

Create a `.env.local` file in the `apps/web-app` directory:

```env
# Add any environment variables your app needs
NEXT_PUBLIC_APP_NAME=Core Engine Demo
```

## 🧪 Testing

```bash
# Run tests for core engine
npm run test --workspace=packages/core-engine

# Run tests for web app
npm run test --workspace=apps/web-app

# Run all tests
npm run test
```

## 📚 API Documentation

### Core Engine Classes

#### Engine
- `registerModule(module: IModule): void` - Register a module
- `unregisterModule(moduleId: string): void` - Unregister a module
- `start(): Promise<void>` - Start the engine
- `stop(): Promise<void>` - Stop the engine
- `getStatus(): EngineStatus` - Get engine status

#### Module
- `initialize(): Promise<void>` - Initialize the module
- `destroy(): Promise<void>` - Destroy the module
- `getStatus(): ModuleStatus` - Get module status

#### EventEmitter
- `on(event: string, listener: Function): void` - Add event listener
- `off(event: string, listener: Function): void` - Remove event listener
- `emit(event: string, ...args: any[]): void` - Emit event

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/your-username/core-engine-nextjs-app/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/core-engine-nextjs-app/discussions)
- **Documentation**: [Project Wiki](https://github.com/your-username/core-engine-nextjs-app/wiki)

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Vercel for seamless deployment
- Tailwind CSS for the utility-first CSS framework
- TypeScript team for type safety
