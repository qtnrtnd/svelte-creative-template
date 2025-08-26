import { getContext, setContext } from 'svelte';
import { PortalContext } from '../core/PortalContext.svelte';

/**
 * A unique symbol used as the key for storing and retrieving the `PortalContext`
 * in Svelte's context API.
 * @internal
 */
const contextKey = Symbol('portal-context');

/**
 * Creates and registers a new `PortalContext` instance in the Svelte context.
 * This should be called within a component that defines a portal boundary,
 * typically the `<Portal>` component itself.
 *
 * @returns The newly created `PortalContext` instance.
 */
export const createPortalContext = () => {
	return setContext(contextKey, new PortalContext());
};

/**
 * Retrieves the `PortalContext` from the Svelte context. This allows child
 * components to access the portal's functionality, such as `trackAnimation`
 * and `keepAlive`, without direct prop drilling.
 *
 * @returns The `PortalContext` instance provided by an ancestor component.
 */
export const usePortal = () => {
	return getContext<PortalContext>(contextKey);
};
