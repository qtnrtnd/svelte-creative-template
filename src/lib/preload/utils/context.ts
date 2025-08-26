import { getContext, setContext } from 'svelte';
import { PreloadContext } from '../core/PreloadContext';

/**
 * A unique symbol used as the key for storing and retrieving the `PreloadContext`
 * in Svelte's context API.
 * @internal
 */
const contextKey = Symbol('preload-context');

/**
 * Retrieves the `PreloadContext` from an ancestor component and extends it for the
 * current component's use. This allows components to tap into the global preloading
 * system to manage their own asset preloading needs.
 *
 * @returns A component-specific `PreloadContext` extension, or `undefined` if no
 * context is found.
 */
export const usePreload = () => {
	const context = getContext<PreloadContext>(contextKey);
	return (context ? PreloadContext.extend(context) : undefined)!;
};

/**
 * Creates a new root `PreloadContext` and registers it in the Svelte context.
 * This should be called at a high level in the component tree, typically in the
 * root layout, to establish the global preloading system.
 *
 * @returns A component-specific extension of the newly created `PreloadContext`.
 */
export const createPreloadContext = () => {
	const context = setContext(contextKey, new PreloadContext());
	return PreloadContext.extend(context);
};
