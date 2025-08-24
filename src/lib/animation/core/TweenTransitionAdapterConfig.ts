import { RESIZE_DEBOUNCE } from '$lib/const';
import { debounce } from '$lib/helpers';
import { onRemove } from '$lib/hooks';
import type { TransitionConfig } from 'svelte/transition';
import type { SvelteTransitionOptions } from '../utils/types';
import type { TweenTransition, TweenTransitionDirection } from './TweenTransition.svelte';
import { resolveDirection } from '../utils/functions';

export type TweenTransitionAdapterFunction = (node: Element) => gsap.core.Animation | null;

export type TweenTransitionAdapterParams = {
	transition: TweenTransitionAdapterFunction | TweenTransition;
	onInterrupt?: (node: Element, params: TweenTransitionAdapterEventParams) => void;
	onComplete?: (node: Element, params: TweenTransitionAdapterEventParams) => void;
	onResize?: (
		node: Element,
		params: TweenTransitionAdapterEventParams
	) => gsap.core.Animation | null | void;
	resizeTarget?: Element;
	keepAlive?: boolean;
};

export type TweenTransitionAdapterEventParams = {
	transition: TweenTransitionAdapterFunction;
	animation: gsap.core.Animation | null;
	progress: number;
};

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
		const animation = this._params.animation;
		if (!animation) return;

		if (this._interrupted) {
			if (this._node.getAttribute('data-interrupt') === this._direction) return;

			this._node.setAttribute('data-direction', this._direction);
			this._node.removeAttribute('data-interrupt');
			this._interrupted = false;
			this._resizeObserver = this._createResizeObserver();
			this._params.animation = this._createAnimation();
		}

		this._params.progress = this._direction !== 'out' ? t : u;

		if (this._node.getAttribute('data-direction') === this._direction) {
			animation.progress(this._params.progress);

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
