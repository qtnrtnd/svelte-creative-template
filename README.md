# Svelte Creative Template

This Svelte creative template is designed to streamline the development of sophisticated, animation-rich web experiences. It provides a powerful, structured API to create and manage complex animations, including seamless page-to-page transitions, without compromising layout integrity. The template intelligently handles client-side resource loading, coordinating it with animations for a polished and performant user experience.

Built with a modern stack including **Svelte 5**, **TypeScript**, **Tailwind CSS**, and **GSAP**, and pre-configured for deployment on **Cloudflare Workers**.

> [!NOTE]
> This template is currently under active development. Features may change, and new APIs will be added. Integration with **Threlte** for 3D graphics is planned for a future release.

## Features

- **Advanced Animation System**: Leverages GSAP for high-performance, complex animations.
- **Stateful Page Transitions**: Create seamless and beautiful transitions between pages.
- **Component-Aware Asset Preloading**: Intelligently preload images and other assets to coordinate with animations.
- **Global State Management**: A centralized context for managing UI state during transitions (e.g., freezing interactions, pausing scroll).
- **Utility Components & Hooks**: A collection of reusable components and hooks to accelerate development.
- **Cloudflare Ready**: Optimized for deployment on Cloudflare's edge network.

## Getting Started

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/qtnrtnd/svelte-creative-template.git
    ```
2.  **Navigate to the project directory:**
    ```bash
    cd svelte-creative-template
    ```
3.  **Install dependencies:**
    ```bash
    yarn install
    ```
4.  **Start the development server:**
    ```bash
    yarn dev
    ```

## Core APIs (`src/lib`)

The `src/lib` directory contains the core logic of the template.

### `gsap.ts`

This file initializes the GSAP library and registers the following plugins, making them available for use throughout the application:

- `ScrollTrigger`
- `ScrollSmoother`
- `Flip`
- `SplitText`

### Animation (`src/lib/animation`)

This is the heart of the template's animation capabilities.

#### `TweenTransition`

- **File**: `src/lib/animation/core/TweenTransition.svelte.ts`
- **Description**: A powerful class for creating and managing complex, stateful tween-based transitions using GSAP. It provides fine-grained control over transition behavior, including lifecycle events, viewport-awareness, and overlapping animations.
- **Key Features**:
  - Manages `intro`, `outro`, and `idle` states.
  - Handles overlapping transitions with strategies like `prevent`, `invalidate`, `restart`.
  - Can be made viewport-aware (`inViewport` option).
  - Dispatches lifecycle events (`introstart`, `introend`, etc.).
  - Can adapt standard Svelte transitions using `TweenTransition.from()`.

#### `Crossfade`

- **File**: `src/lib/animation/core/Crossfade.ts`
- **Description**: A class that facilitates creating a pair of synchronized transitions for a smooth crossfade effect between two elements. It's ideal for scenarios where an element transforms into another during a page change (e.g., a thumbnail on a list page transitioning to a hero image on a detail page).
- **Usage**:
  - Use `Crossfade.create()` to generate a `[send, receive]` tuple of transition functions.
  - Apply the `send` transition to the outgoing element and the `receive` transition to the incoming element.
  - Both elements must share the same unique `key`.

#### `TweenTransitionAdapterConfig`

- **File**: `src/lib/animation/core/TweenTransitionAdapterConfig.ts`
- **Description**: A class that adapts a GSAP-based animation to work with Svelte's transition system. It wraps a `TweenTransition` or a custom animation function and produces a `TransitionConfig` object that Svelte can use, bridging the gap between GSAP's imperative API and Svelte's declarative transitions.

### Application State (`src/lib/states`)

#### `AppContext`

- **File**: `src/lib/states/core/AppContext.svelte.ts`
- **Description**: Manages global application state, particularly related to page transitions and interaction states.
- **Key States**:
  - `initial`: `true` only during the initial application load.
  - `swapping`: `true` when a page transition is active.
  - `frozen`: A state to disable user interactions (e.g., during a critical animation).
  - `scrollPaused`: A state to disable scrolling.
- **Usage**: Components can interact with this context to coordinate actions with global state, for example, by disabling a button when `frozen` is true.

#### `InterfaceContext`

- **File**: `src/lib/states/core/InterfaceContext.svelte.ts`
- **Description**: Manages the state of the user interface, particularly values that need to be shared across components during UI events like page transitions. For example, it stores the `swapOffset` to maintain visual positioning of elements during a page swap.

### Asset Preloading (`src/lib/preload`)

#### `PreloadContext`

- **File**: `src/lib/preload/core/PreloadContext.ts`
- **Description**: Manages the preloading of assets, primarily images, to improve performance by loading them before they are needed. It's component-aware, meaning it tracks which components are using which assets and can clean up resources efficiently.
- **Usage**: The `usePreload` hook provides a component-specific interface to `preloadImage()`. The context handles responsive images (`<picture>`) and ensures the correct image variant is loaded based on the viewport.

### Layout Management (`src/lib/layout`)

#### `LayoutContext`

- **File**: `src/lib/layout/core/LayoutContext.svelte.ts`
- **Description**: A context for managing layout "snippets". It provides a way to render content from child components into designated areas of a parent layout.
- **Key Features**:
  - `fixed`: A reactive set for snippets that should be rendered in a 'fixed' container, useful for elements that need to persist across page transitions or remain fixed in the viewport.

### Portal (`src/lib/portal`)

#### `PortalContext`

- **File**: `src/lib/portal/core/PortalContext.svelte.ts`
- **Description**: Manages the state and behavior of transitions within a `Portal` component. Its primary role is to track the durations of outgoing animations to determine how long a portal's content should be "kept alive" during a page transition, ensuring that animations can complete before the element is removed from the DOM.
- **Related Component**: `Portal.svelte`

### Suspense (`src/lib/suspense`)

#### `SuspenseContext`

- **File**: `src/lib/suspense/core/SuspenseContext.svelte.ts`
- **Description**: Manages a suspense boundary, tracking pending tasks (Promises) and states to control the visibility of content. It allows you to declaratively handle loading states for asynchronous operations.
- **Key Features**:
  - `suspendTasks`: Awaits promises.
  - `suspendState`: Suspends based on a boolean function.
  - `onReveal`/`onSuspend`: Hooks for suspense state changes.
- **Related Component**: `Suspense.svelte`

### Scroller (`src/lib/scroller`)

- **File**: `src/lib/scroller/utils/context.ts`
- **Description**: Provides functions to manage a global `gsap.ScrollSmoother` instance.
- **API**:
  - `createScrollerContext(options)`: Creates a `ScrollSmoother` instance and registers it in Svelte's context. Should be called once in a high-level layout component.
  - `useScroller()`: Retrieves the `ScrollSmoother` instance from the context.

### Hooks (`src/lib/hooks`)

This directory provides a powerful event system and a set of predefined hooks for key application lifecycle events.

#### `Hook` Class

- **File**: `src/lib/hooks/core/Hook.ts`
- **Description**: A class that implements the observer pattern, allowing for the creation of event channels where listeners can subscribe to dispatched events. It supports listener priority, one-time listeners, and automatic cleanup. Use `Hook.create()` to create a new hook.

#### Event Hooks

- **File**: `src/lib/hooks/utils/functions.ts`
- **Description**: A collection of pre-defined hooks for common application events.
- **Available Hooks**:
  - `onResize`: Dispatched when the window is resized.
  - `onScroll`: Dispatched on scroll, providing the `ScrollSmoother` instance.
  - `beforeSwap`, `onSwap`, `afterSwap`: A series of hooks that fire during page transitions, providing access to the leaving and entering page elements.
  - `onRemove`: Fires a callback when a specific DOM element is removed.
  - `beforeRefresh`, `onRefresh`: Fire before and after a `ScrollTrigger` instance is refreshed.

### Helpers (`src/lib/helpers`)

A collection of utility functions and Svelte attachments to simplify common tasks.

#### Utility Functions

- **File**: `src/lib/helpers/utils/functions.ts`
- **Description**: A suite of general-purpose utility functions.
- **Key Functions**:
  - `debounce(fn, delay)`: Creates a debounced version of a function.
  - `fromClient(create, cleanup)`: Executes a function only on the client-side.
  - `mergeCls(...inputs)`: Merges Tailwind CSS classes safely.
  - `setParams(params)`: Updates URL search parameters without a full navigation.
  - `once(fn)`: Creates a function that can only be called once.

#### `observer` Attachment

- **File**: `src/lib/helpers/utils/attachments.ts`
- **Description**: A Svelte attachment (`{@attach ...}`) factory for creating `ResizeObserver`, `MutationObserver`, and `IntersectionObserver` instances declaratively.

## Reusable Components (`src/lib/components`)

This template includes a set of utility components to handle common patterns.

- **`Page.svelte`**: A wrapper for page content that orchestrates page-level transitions using the `AppContext` and the `onSwap` hooks.
- **`Portal.svelte`**: Renders its children into a different part of the DOM. It uses `PortalContext` to manage the lifecycle of its content, especially during page transitions.
- **`Suspense.svelte`**: Manages loading states by wrapping asynchronous operations. It provides a `SuspenseContext` to its children, allowing them to register tasks and control the suspense boundary.
- **`Template.svelte`**: A core component that likely orchestrates the main application layout and initializes the core contexts.
- **`Anchor.svelte`**: An enhanced anchor tag.
- **`Fixed.svelte`**: A component to place content into the `LayoutContext`'s `fixed` area.
- **`OverflowMarquee.svelte`**: Creates a scrolling marquee effect for overflowing content.
- **`Picture.svelte`**: A component for responsive images that integrates with the `PreloadContext` for optimized loading.

## Scripts

The `package.json` file includes the following scripts:

- `yarn dev`: Starts the Vite development server.
- `yarn build`: Builds the application for production.
- `yarn preview`: Builds the app and previews the production build locally using Wrangler.
- `yarn deploy`: Deploys the application to Cloudflare Workers.
- `yarn check`: Runs `svelte-check` to type-check your Svelte components.
- `yarn lint`: Lints the codebase using ESLint and Prettier.
- `yarn format`: Formats the entire codebase with Prettier.
- `yarn cf-typegen`: Generates TypeScript types for your Cloudflare Worker bindings.
