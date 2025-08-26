/**
 * @file Provides context utilities for creating and accessing suspense boundaries.
 * @module lib/suspense/utils/context
 */

import { getContext, setContext } from 'svelte';
import { SuspenseContext, type SuspenseContextOptions } from '../core/SuspenseContext.svelte';

/**
 * Defines the scope for a suspense context, determining its lifecycle and accessibility.
 * - `app`: Singleton context for the entire application.
 * - `page`: Context tied to the current page, destroyed on navigation.
 * - `parent`: Default context, nested within the closest ancestor suspense boundary.
 */
export type SuspenseScope = 'app' | 'page' | 'parent';

/**
 * Unique symbols used as keys for setting and getting suspense contexts.
 */
export const suspenseContextKeys: Record<SuspenseScope, symbol> = {
	app: Symbol('app-suspense'),
	page: Symbol('page-suspense'),
	parent: Symbol('parent-suspense')
};

/**
 * Creates a new `SuspenseContext` and sets it in the Svelte context.
 * This also extends the context to provide a component-friendly API.
 * @param options - Configuration options for the `SuspenseContext`.
 * @returns A `ComponentSuspense` instance for interacting with the context.
 */
export const createSuspenseContext = (options?: SuspenseContextOptions) => {
	const context = setContext(suspenseContextKeys.parent, new SuspenseContext(options));

	if (context.options.scope && context.options.scope !== 'parent') {
		setContext(suspenseContextKeys[context.options.scope], context);
	}

	return SuspenseContext.extend(context);
};

/**
 * Retrieves an existing `SuspenseContext` from the Svelte context.
 * @param scope - The scope from which to retrieve the context. Defaults to 'parent'.
 * @returns A `ComponentSuspense` instance if found, otherwise `undefined`.
 */
export const useSuspense = (scope: SuspenseScope = 'parent') => {
	const context = getContext<SuspenseContext>(suspenseContextKeys[scope]);
	return (context ? SuspenseContext.extend(context) : undefined)!;
};
