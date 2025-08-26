import { onDestroy } from 'svelte';

/**
 * An extension point for component-specific properties. This can be populated
 * with state management logic relevant to individual components.
 * @internal
 */
type ComponentExtension = object;

/**
 * The complete interface context available to a component, combining the main
 * `InterfaceContext` with any component-specific extensions.
 */
export type ComponentInterface = Public<InterfaceContext> & ComponentExtension;

/**
 * Manages the state of the user interface, particularly values that need to be
 * shared across components during UI events like page transitions.
 */
export class InterfaceContext {
	/**
	 * The scroll offset captured during a page swap. This is used to maintain
	 * the correct visual positioning of elements during the transition.
	 * @private
	 */
	private _swapOffset: number = $state(0);

	/**
	 * Gets or sets the scroll offset used during a page swap.
	 */
	swapOffset(): number;
	swapOffset(value: number): void;
	swapOffset(value?: number): number | void {
		if (value === undefined) return this._swapOffset;
		this._swapOffset = value;
	}

	/**
	 * Extends the global `InterfaceContext` to provide a component-specific interface.
	 * This allows individual components to interact with the shared UI state.
	 *
	 * @param context - The global `InterfaceContext` instance.
	 * @returns A `ComponentInterface` object with methods scoped to the component.
	 */
	static extend(context: InterfaceContext): ComponentInterface {
		const extended: ComponentInterface = {
			swapOffset: context.swapOffset.bind(context),
            // Component-specific implementation can be added here.
		};

		onDestroy(() => {
			// Perform any necessary cleanup when the component is destroyed.
		});

		return extended;
	}
}
