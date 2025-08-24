import { onDestroy, onMount } from 'svelte';
import { SvelteSet } from 'svelte/reactivity';
import { some } from '../utils/functions';

type ComponentExtension = {
	frozen(): boolean;
	frozen(value: boolean): void;
	frozen(value?: boolean): boolean | void;

	scrollPaused(): boolean;
	scrollPaused(value: boolean): void;
	scrollPaused(value?: boolean): boolean | void;
};

export type ComponentApp = Public<AppContext> & ComponentExtension;

export class AppContext {
	private _initial = true;
	private _swapping = $state(false);
	private _swap = $state(Promise.withResolvers<void>());

	private _frozenStates = new SvelteSet<symbol>();
	private _scrollPausedStates = new SvelteSet<symbol>();

	constructor() {
		this._init();
	}

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

	get initial() {
		return this._initial;
	}

	swapping(): boolean;
	swapping(value: boolean): void;
	swapping(value?: boolean): boolean | void {
		if (value === undefined) return this._swapping;
		this._swapping = value;
	}

	swap(): PromiseWithResolvers<void>;
	swap(value: PromiseWithResolvers<void>): void;
	swap(value?: PromiseWithResolvers<void>): PromiseWithResolvers<void> | void {
		if (value === undefined) return this._swap;
		this._swap = value;
	}

	private _init(): void {
		onMount(() => {
			this._initial = false;
		});
	}
}
