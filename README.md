# ChromeFlex 🚀

A modern and flexible Chrome extension framework with modular TypeScript architecture.

## 🚀 Features

- **Modular architecture**: Feature system with complete lifecycle
- **Strict TypeScript**: Type safety and complete IntelliSense
- **Hot reload**: Fast development with automatic reloading
- **EventBus**: Type-safe inter-feature communication
- **Modern build**: Vite + @crxjs/vite-plugin
- **Linting**: Biome for clean and consistent code
- **Auto generation**: Script to create features quickly

## 📦 Installation

```bash
# Clone the project
git clone <your-repo>
cd ChromeFlex

# Install dependencies
npm install
```

## 🛠️ Development

### Start the development server

```bash
npm run dev
```

The server starts on `http://localhost:5173` with hot reload enabled.

### Create a new feature

```bash
npm run create-feature my-feature-name
```

This automatically generates:
- The `src/features/my-feature-name/` folder
- The `index.ts` file with base template
- Updates the feature manager

### Feature structure

```typescript
import { BaseFeature } from "@/core/base-feature";
import type { FeatureConfig, FeatureContext } from "@/types";

export default class MyFeatureFeature extends BaseFeature {
  constructor() {
    const config: FeatureConfig = {
      name: "my-feature",
      matches: ["https://example.com/*"], // Target URLs
      priority: 10,
      enabled: true,
      shouldActivate: (context: FeatureContext) => {
        // Custom activation logic
        return true;
      },
    };

    super(config);
  }

  protected async onInit(context: FeatureContext): Promise<void> {
    // Initialization: data setup, event subscriptions
  }

  protected async onStart(context: FeatureContext): Promise<void> {
    // Start: adding DOM elements, listeners, etc.
  }

  protected async onStop(): Promise<void> {
    // Stop: cleaning listeners, DOM removal
  }

  protected async onDestroy(): Promise<void> {
    // Destroy: final cleanup
  }
}
```

### Feature lifecycle

1. **Init**: Configuration and preparation
2. **Start**: Activation and operation
3. **Stop**: Pause and temporary cleanup
4. **Destroy**: Final cleanup and removal

### Communication between features

```typescript
// Emit an event
this.eventBus.emit("my-event", { data: "value" }, this.name);

// Listen to an event
this.eventBus.on("other-event", (data, source) => {
  console.log("Received:", data, "from:", source);
});
```

## 🔧 Available scripts

```bash
# Development with hot reload
npm run dev

# Production build
npm run build

# TypeScript check
npx tsc --noEmit

# Linting and formatting
npm run biome:check
npx biome check --write

# Create a new feature
npm run create-feature <feature-name>
```

## 📁 Project structure

```
src/
├── core/                 # Main architecture
│   ├── base-feature.ts   # Base class for features
│   ├── event-bus.ts      # Event system
│   ├── feature-manager.ts # Feature manager
│   └── feature-registry.ts # Registry and dependencies
├── features/             # Your features
│   ├── example-button/   # Example feature
│   └── test-feature/     # Test feature
├── types/                # TypeScript definitions
├── utils/                # Utilities
├── background.ts         # Background script
├── content.ts           # Content script
└── manifest.json        # Extension manifest

scripts/
├── build.js             # Advanced build script
└── create-feature.js    # Feature generator
```

## 🚀 Installation in Chrome

1. Build the extension:
   ```bash
   npm run build
   ```

2. Open Chrome and go to `chrome://extensions/`

3. Enable "Developer mode"

4. Click "Load unpacked extension"

5. Select the `dist/` folder

## 🎯 Feature development

### Best practices

1. **Naming**: Use descriptive names in kebab-case
2. **Matches**: Precisely specify target URLs
3. **Priority**: Higher number means higher priority
4. **Cleanup**: Always clean up in `onStop` and `onDestroy`
5. **Logging**: Use `this.logger` for logs

### Usage examples

```typescript
// Add a button to the page
protected async onStart(context: FeatureContext): Promise<void> {
  const button = document.createElement("button");
  button.textContent = "My button";
  button.onclick = () => this.handleClick();

  document.body.appendChild(button);
  this.elements.set("main-button", button);
}

// Clean up on stop
protected async onStop(): Promise<void> {
  const button = this.elements.get("main-button");
  if (button) {
    button.remove();
    this.elements.delete("main-button");
  }
}
```

## 🔍 Debugging

- Logs appear in the browser console
- Use Chrome DevTools to inspect the extension
- Hot reload allows quick testing of modifications

## 📝 Configuration

### TypeScript

Strict configuration in `tsconfig.json` with:
- Strict checks enabled
- Path aliases configured (`@/core`, `@/features`, etc.)
- ES2022 modules support

### Biome

Linting and formatting with strict rules:
- No `var`, use `const`/`let`
- No explicit `any`
- Consistent formatting

### Vite

Optimized build with:
- @crxjs plugin for Chrome extensions
- Hot reload in development
- Minification in production

## 🤝 Contributing

1. Create a branch for your feature
2. Develop following conventions
3. Test with `npm run build`
4. Check linting with `npm run biome:check`
5. Create a pull request

## 📄 License

MIT - See LICENSE file for more details.

---

**Happy coding! 🎉**
