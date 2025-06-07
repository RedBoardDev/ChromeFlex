# ChromeFlex - Architecture Documentation

## 🏗️ Architecture Overview

ChromeFlex is a modern, TypeScript-based Chrome extension framework designed for maximum flexibility and ease of development.

### Core Principles

- **Type Safety**: Strict TypeScript with comprehensive type coverage
- **Modularity**: Feature-based architecture with clear separation of concerns
- **Event-Driven**: EventBus for inter-feature communication
- **Lifecycle Management**: Complete feature lifecycle (init → start → stop → destroy)
- **Developer Experience**: Hot reload, debugging tools, and comprehensive error handling

## 📁 Project Structure

```
src/
├── core/                    # Core framework
│   ├── base-feature.ts     # Abstract base class for features
│   ├── event-bus.ts        # Event system for communication
│   ├── feature-manager.ts  # Orchestrates feature lifecycle
│   └── feature-registry.ts # Manages feature registration
├── features/               # Your features go here
│   └── example-button/     # Example feature
├── utils/                  # Utility functions
│   ├── dom.ts             # DOM manipulation helpers
│   ├── events.ts          # Event handling utilities
│   ├── logger.ts          # Logging system
│   └── storage.ts         # Storage management
├── types/                  # TypeScript type definitions
├── content.ts             # Content script entry point
├── background.ts          # Background service worker
└── manifest.json          # Extension manifest
```

## 🚀 Creating a New Feature

### 1. Create Feature Directory

```bash
mkdir src/features/your-feature-name
```

### 2. Create Feature Class

```typescript
// src/features/your-feature-name/index.ts
import type { FeatureConfig, FeatureContext } from '@/types';
import { BaseFeature } from '@/core/base-feature';

export default class YourFeature extends BaseFeature {
  constructor() {
    const config: FeatureConfig = {
      name: 'your-feature-name',
      matches: ['https://example.com/*'],
      priority: 10,
      enabled: true
    };
    super(config);
  }

  protected async onInit(context: FeatureContext): Promise<void> {
    this.logger.info('Initializing your feature');
    // Setup code here
  }

  protected async onStart(context: FeatureContext): Promise<void> {
    this.logger.info('Starting your feature');
    // Main feature logic here
  }

  protected async onStop(): Promise<void> {
    this.logger.info('Stopping your feature');
    // Cleanup code here
  }

  protected async onDestroy(): Promise<void> {
    this.logger.info('Destroying your feature');
    // Final cleanup here
  }
}
```

### 3. Register Feature

Add your feature to the discovery list in `src/core/feature-manager.ts`:

```typescript
private async discoverFeatures(): Promise<Array<{ name: string; path: string }>> {
  return [
    { name: 'example-button', path: '@/features/example-button' },
    { name: 'your-feature-name', path: '@/features/your-feature-name' }, // Add this line
  ];
}
```

## 🔧 Available Utilities

### DOM Utilities
```typescript
import { addButton, waitForElement, getElement } from '@/utils/dom';

// Add a button to the page
const button = addButton('body', 'Click me!', () => console.log('Clicked!'));

// Wait for an element to appear
const element = await waitForElement('.dynamic-content', { timeout: 5000 });

// Get element with error handling
const requiredElement = getElement('#important', true); // throws if not found
```

### Event Management
```typescript
import { EventManager, debounce, throttle } from '@/utils/events';

const eventManager = new EventManager();

// Add event listener with automatic cleanup
const cleanup = eventManager.addEventListener(button, 'click', () => {
  console.log('Button clicked!');
});

// Debounced function
const debouncedSearch = debounce((query: string) => {
  // Search logic
}, 300);
```

### Storage
```typescript
import { setItem, getItem } from '@/utils/storage';

// Store data (automatically uses Chrome storage or localStorage fallback)
await setItem('user-preferences', { theme: 'dark' });

// Retrieve data
const preferences = await getItem('user-preferences', { theme: 'light' });
```

### Event Communication
```typescript
// Emit custom events
this.emitEvent('my-feature:action-completed', {
  success: true,
  data: someData
});

// Listen to events
this.onEvent('other-feature:state-changed', (event) => {
  console.log('Other feature changed state:', event.payload);
});
```

## 🛠️ Development

### Start Development Server
```bash
npm run dev
```

This starts Vite with hot reload enabled. Changes to your code will automatically reload the extension.

### Build for Production
```bash
npm run build
```

### Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the `dist` folder

## 🐛 Debugging

### Development Tools

In development mode, debugging utilities are available at `window.ChromeFlex`:

```javascript
// Check extension status
ChromeFlex.getStatus();

// Reload all features
ChromeFlex.reload();

// Access feature manager
ChromeFlex.featureManager;

// Access logger
ChromeFlex.logger.info('Debug message');
```

### Logging

The logger provides different levels:

```typescript
this.logger.debug('Debug information');
this.logger.info('General information');
this.logger.warn('Warning message');
this.logger.error('Error message');
```

### Feature States

Features go through these states:
- `idle` → `initializing` → `initialized` → `starting` → `running`
- `running` → `stopping` → `stopped`
- Any state → `error` (on failure)

## 📋 Best Practices

### 1. Feature Isolation
- Each feature should be self-contained
- Use the EventBus for inter-feature communication
- Clean up resources in `onStop()` and `onDestroy()`

### 2. Error Handling
- Always handle errors gracefully
- Use try-catch blocks in async methods
- Let the framework handle state transitions on errors

### 3. Performance
- Use `waitForElement()` instead of polling
- Debounce expensive operations
- Clean up event listeners and intervals

### 4. Configuration
- Define clear activation conditions in `shouldActivate()`
- Use priority to control load order (higher = earlier)
- Mark features as `enabled: false` to disable temporarily

## 🔄 Hot Reload

Hot reload is enabled by default in development mode. When you save changes:

1. The extension detects file changes
2. Features are stopped and destroyed
3. New code is loaded
4. Features are re-initialized and started

This allows for rapid development without manually reloading the extension.

## 📝 TypeScript Configuration

The project uses strict TypeScript settings:
- `strict: true`
- `noImplicitAny: true`
- `strictNullChecks: true`
- `noImplicitReturns: true`

This ensures maximum type safety and helps catch errors at compile time.

## 🔧 Extending the Framework

You can extend the framework by:

1. **Adding new utility functions** in `src/utils/`
2. **Creating custom base classes** that extend `BaseFeature`
3. **Adding new event types** in the EventBus
4. **Extending the storage system** with new backends

The architecture is designed to be extensible while maintaining type safety and consistency.