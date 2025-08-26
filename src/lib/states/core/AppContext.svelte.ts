import { onDestroy, onMount } from 'svelte';
import { SvelteSet } from 'svelte/reactivity';
import { some } from '../utils/functions';

/**
 * The public interface for a component-specific extension of the `AppContext`.
 * It provides methods for components to interact with global states like `frozen`
 * and `scrollPaused`.
 * @internal
 */
type ComponentExtension = {
	/**
	 * Gets or sets the frozen state for the component. When any component is frozen,
	 * certain interactions like navigation may be disabled.
	 */
	frozen(): boolean;
	frozen(value: boolean): void;
	frozen(value?: boolean): boolean | void;

	/**
	 * Gets or sets the scroll-paused state for the component. When any component
	 * has scroll paused, global scrolling may be disabled.
	 */
	scrollPaused(): boolean;
	scrollPaused(value: boolean): void;
	scrollPaused(value?: boolean): boolean | void;
};

/**
 * The complete app context available to a component, combining the main `AppContext`
 * with component-specific state management methods.
 */
export type ComponentApp = Public<AppContext> & ComponentExtension;

/**
 * Manages the global application state, particularly related to page transitions
 * and interaction states. It tracks whether the app is in its initial load,
 * if a page swap is in progress, and whether interactions or scrolling are paused.
 */
export class AppContext {
	private _initial = true;
	private _swapping = $state(false);
	private _swap = $state(Promise.withResolvers<void>());

	private _frozenStates = new SvelteSet<symbol>();
	private _scrollPausedStates = new SvelteSet<symbol>();

	constructor() {
		this._init();
	}

	/**
	 * Extends the global `AppContext` to provide a component-specific interface.
	 * This allows individual components to contribute to the global `frozen` and
	 * `scrollPaused` states without directly mutating the main context.
	 *
	 * @param context - The global `AppContext` instance.
	 * @returns A `ComponentApp` object with methods scoped to the component.
	 */
	static extend(context: AppContext): ComponentApp {
		const componentId = Symbol();

		const extended: ComponentApp = {
			initial: context.initial,
			swapping: context.swapping.bind(context),
			swap: context.swap.bind(context),
			frozen(value?: boolean) {
				return some(context._frozenStates, componentId, value);
			},
			scrollPaused(value?: boolean) {
				return some(context._scrollPausedStates, componentId, value);
			}
		};

		onDestroy(() => {
			extended.frozen(false);
			extended.scrollPaused(false);
		});

		return extended;
	}

	/**
	 * Indicates if the application is in its initial loading state.
	 * This is `true` until the first page has mounted.
	 */
	get initial() {
		return this._initial;
	}

	/**
	 * Gets or sets the page swapping state. `true` when a page transition is active.
	 */
	swapping(): boolean;
	swapping(value: boolean): void;
	swapping(value?: boolean): boolean | void {
		if (value === undefined) return this._swapping;
		this._swapping = value;
	}

	/**
	 * Gets or sets the current page swap promise. This promise is used to
	 * coordinate animations and state changes during a page transition.
	 */
	swap(): PromiseWithResolvers<void>;
	swap(value: PromiseWithResolvers<void>): void;
	swap(value?: PromiseWithResolvers<void>): PromiseWithResolvers<void> | void {
		if (value === undefined) return this._swap;
		this._swap = value;
	}

	/**
	 * Initializes the context, setting `initial` to `false` after the first mount.
	 * @internal
	 */
	private _init(): void {
		onMount(() => {
			this._initial = false;
		});
	}
}
