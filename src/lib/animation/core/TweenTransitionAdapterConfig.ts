import { RESIZE_DEBOUNCE } from '$lib/const';
import { debounce } from '$lib/helpers';
import { onRemove } from '$lib/hooks';
import type { TransitionConfig } from 'svelte/transition';
import type { SvelteTransitionOptions } from '../utils/types';
import type { TweenTransition, TweenTransitionDirection } from './TweenTransition.svelte';
import { resolveDirection } from '../utils/functions';

/**
 * Defines the signature for a function that creates a GSAP animation for a Svelte transition.
 * This function is called with the HTML element undergoing the transition.
 *
 * @param node - The HTML element to which the transition is being applied.
 * @returns A GSAP animation instance (`gsap.core.Animation`) or `null` if no animation is required.
 */
export type TweenTransitionAdapterFunction = (node: Element) => gsap.core.Animation | null;

/**
 * Specifies the parameters for configuring a `TweenTransitionAdapter`.
 */
export type TweenTransitionAdapterParams = {
	/**
	 * The core transition logic. This can be either a `TweenTransitionAdapterFunction` that returns
	 * a GSAP animation, or a `TweenTransition` component instance which provides separate
	 * intro and outro animations.
	 */
	transition: TweenTransitionAdapterFunction | TweenTransition;
	/**
	 * An optional callback function that is executed when the transition is interrupted.
	 * An interruption occurs, for example, when a new transition is triggered in the opposite direction
	 * before the current one has completed.
	 *
	 * @param node - The HTML element being transitioned.
	 * @param params - The event parameters, including the animation instance and progress.
	 */
	onInterrupt?: (node: Element, params: TweenTransitionAdapterEventParams) => void;
	/**
	 * An optional callback function that is executed upon the successful completion of the transition.
	 *
	 * @param node - The HTML element that was transitioned.
	 * @param params - The event parameters, including the animation instance and final progress.
	 */
	onComplete?: (node: Element, params: TweenTransitionAdapterEventParams) => void;
	/**
	 * An optional callback function that is triggered when the target element is resized.
	 * This allows the animation to be dynamically adjusted in response to layout changes.
	 * It can return a new GSAP animation to replace the existing one.
	 *
	 * @param node - The HTML element being transitioned.
	 * @param params - The event parameters, including the current animation instance.
	 * @returns A new GSAP animation, `null`, or `void`.
	 */
	onResize?: (
		node: Element,
		params: TweenTransitionAdapterEventParams
	) => gsap.core.Animation | null | void;
	/**
	 * The target element to monitor for resize events. If not specified, the transitioning
	 * `node` itself is observed.
	 */
	resizeTarget?: Element;
	/**
	 * If `true`, the GSAP animation and its associated `ResizeObserver` are not immediately
	 * cleaned up after the transition completes. Instead, cleanup is deferred until the element
	 * is removed from the DOM. This is useful for persistent animations.
	 */
	keepAlive?: boolean;
};

/**
 * Defines the structure of the event object passed to `TweenTransitionAdapter` callbacks.
 */
export type TweenTransitionAdapterEventParams = {
	/**
	 * The transition function that is being executed.
	 */
	transition: TweenTransitionAdapterFunction;
	/**
	 * The underlying GSAP animation instance that controls the transition.
	 * This can be `null` if no animation was created.
	 */
	animation: gsap.core.Animation | null;
	/**
	 * The current progress of the transition, represented as a value between 0 (start) and 1 (end).
	 */
	progress: number;
};

/**
 * A class that adapts a GSAP-based animation to work with Svelte's transition system.
 * It wraps a `TweenTransition` or a custom animation function and produces a `TransitionConfig`
 * object that Svelte can use.
 */
export class TweenTransitionAdapterConfig {
	private _node: Element;
	private _transition: TweenTransitionAdapterFunction;
	private _onInterrupt?: TweenTransitionAdapterParams['onInterrupt'];
	private _onComplete?: TweenTransitionAdapterParams['onComplete'];
	private _onResize?: TweenTransitionAdapterParams['onResize'];
	private _resizeTarget?: Element;
	private _keepAlive?: boolean;
	private _direction: TweenTransitionDirection;
	private _params: TweenTransitionAdapterEventParams;
	private _resizeObserver: ResizeObserver | null = null;
	private _interrupted = false;

	private constructor(
		node: Element,
		{ transition, ...params }: TweenTransitionAdapterParams,
		options: SvelteTransitionOptions
	) {
		this._node = node;
		this._direction = resolveDirection(node, options.direction);
		this._transition =
			typeof transition === 'function'
				? transition
				: () => transition[this._direction === 'in' ? 'intro' : 'outro']();
		this._onInterrupt = params.onInterrupt;
		this._onComplete = params.onComplete;
		this._onResize = params.onResize;
		this._resizeTarget = params.resizeTarget;
		this._keepAlive = params.keepAlive;

		this._params = {
			transition: this._transition,
			animation: this._createAnimation(),
			progress: 0
		};
	}

	/**
	 * Creates a Svelte `TransitionConfig` object from the provided adapter parameters.
	 * This static method is the entry point for creating a configured transition.
	 *
	 * @param node - The HTML element to which the transition will be applied.
	 * @param params - The configuration parameters for the adapter.
	 * @param options - The Svelte transition options, such as `direction`.
	 * @returns A Svelte `TransitionConfig` object.
	 */
	static create(
		node: Element,
		params: TweenTransitionAdapterParams,
		options: SvelteTransitionOptions
	): TransitionConfig {
		const config = new this(node, params, options);

		if (!config._params.animation) {
			return {};
		}

		config._resizeObserver = config._createResizeObserver();
		config._node.setAttribute('data-direction', config._direction);

		return {
			delay: config._params.animation.delay() * 1000,
			duration: config._params.animation.duration() * 1000,
			tick: config._tick
		};
	}

	private _tick = (t: number, u: number): void => {
		if (this._interrupted) {
			if (this._node.getAttribute('data-interrupt') === this._direction) return;

			this._node.setAttribute('data-direction', this._direction);
			this._node.removeAttribute('data-interrupt');
			this._interrupted = false;
			this._resizeObserver = this._createResizeObserver();
			this._params.animation = this._createAnimation();
		}

		if (!this._params.animation) return;

		this._params.progress = this._direction !== 'out' ? t : u;

		if (this._node.getAttribute('data-direction') === this._direction) {
			this._params.animation.progress(this._params.progress);

			if (this._params.progress === 1) {
				if (this._onComplete) this._onComplete(this._node, this._params);
				if (!this._keepAlive) this._cleanup();
				else onRemove(this._node, () => this._cleanup());
			}
		} else {
			this._interrupted = true;
			if (this._direction === 'in') this._node.setAttribute('data-interrupt', this._direction);
			if (this._onInterrupt) this._onInterrupt(this._node, this._params);
			this._cleanup();
		}
	};

	private _createAnimation(existing?: gsap.core.Animation | null): gsap.core.Animation | null {
		const animation = existing ?? this._transition(this._node);
		if (animation) animation.paused(true);
		return animation;
	}

	private _createResizeObserver(): ResizeObserver | null {
		if (!this._onResize) return null;

		let firstCall = true;
		const observer = new ResizeObserver(
			debounce(() => {
				if (firstCall) {
					firstCall = false;
					return;
				}
				const animation = this._onResize!(this._node, this._params);
				if (animation !== undefined)
					this._params.animation = animation && this._createAnimation(animation);
			}, RESIZE_DEBOUNCE)
		);

		observer.observe(this._resizeTarget ?? this._node);
		return observer;
	}

	private _cleanup(): void {
		if (this._params.animation) this._params.animation.kill();
		if (this._resizeObserver) this._resizeObserver.disconnect();
	}
}
