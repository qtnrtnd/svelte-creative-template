import { getContext, setContext } from 'svelte';
import { AppContext } from '../core/AppContext.svelte';
import { InterfaceContext } from '../core/InterfaceContext.svelte';

/**
 * A unique symbol for the AppContext key.
 * @internal
 */
const appContextKey = Symbol('app-context');

/**
 * Creates a new `AppContext` and registers it in the Svelte context.
 * This should be called at the root of the application.
 *
 * @returns A component-specific extension of the `AppContext`.
 */
export const createAppContext = () => {
	const context = setContext(appContextKey, new AppContext());
	return AppContext.extend(context);
};

/**
 * Retrieves and extends the `AppContext` from the Svelte context for component use.
 *
 * @returns A component-specific `AppContext` extension.
 */
export const useApp = () => {
	const context = getContext<AppContext>(appContextKey);
	return (context ? AppContext.extend(context) : undefined)!;
};

/**
 * A unique symbol for the InterfaceContext key.
 * @internal
 */
const interfaceContextKey = Symbol('interface-context');

/**
 * Creates a new `InterfaceContext` and registers it in the Svelte context.
 * This should be called at the root of the application.
 *
 * @returns A component-specific extension of the `InterfaceContext`.
 */
export const createInterfaceContext = () => {
	const context = setContext(interfaceContextKey, new InterfaceContext());
	return InterfaceContext.extend(context);
};

/**
 * Retrieves and extends the `InterfaceContext` from the Svelte context for component use.
 *
 * @returns A component-specific `InterfaceContext` extension.
 */
export const useInterface = () => {
	const context = getContext<InterfaceContext>(interfaceContextKey);
	return (context ? InterfaceContext.extend(context) : undefined)!;
};
