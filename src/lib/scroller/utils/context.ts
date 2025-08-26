import { getContext, setContext } from 'svelte';
import { ScrollSmoother } from '$lib/gsap';
import { fromClient } from '$lib/helpers';

/**
 * A unique symbol used as the key for storing and retrieving the `ScrollSmoother`
 * instance in Svelte's context API.
 * @internal
 */
const contextKey = Symbol('scroller');

/**
 * Creates a new `ScrollSmoother` instance and registers it in the Svelte context.
 * This function should be called once at a high level in the component tree,
 * typically in the root layout, to enable smooth scrolling for the entire application.
 *
 * The `ScrollSmoother` instance is created only on the client-side and is
 * automatically killed when the component is destroyed.
 *
 * @param options - Configuration options for the `ScrollSmoother` instance.
 * @returns The `ScrollSmoother` instance.
 */
export const createScrollerContext = (options: ScrollSmoother.Vars = {}) => {
	return setContext(
		contextKey,
		fromClient(
			() => ScrollSmoother.create(options),
			(s) => s.kill()
		)
	);
};

/**
 * Retrieves the `ScrollSmoother` instance from the Svelte context. This allows
 * any child component to access and interact with the smooth scrolling functionality.
 *
 * @returns The `ScrollSmoother` instance provided by an ancestor component.
 */
export const useScroller = () => {
	return getContext<ScrollSmoother>(contextKey);
};
