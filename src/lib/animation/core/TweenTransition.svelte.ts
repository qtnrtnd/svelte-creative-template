import { gsap, ScrollTrigger } from '$lib/gsap';
import { extract, fromClient } from '$lib/helpers';
import { onMount, untrack } from 'svelte';
import { resolveDirection, toKeyframe } from '../utils/functions';
import type { SvelteTransitionDirection, SvelteTransitionFunction } from '../utils/types';
import { linear } from 'svelte/easing';

/**
 * Defines how to attach an element to a transition.
 * It can be an Element, a CSS selector string, or a function that returns an Element.
 */
type Attach = (() => Element | undefined) | Element | string;

/**
 * The type of a tween transition.
 * - `idle`: A transition to a specific state without animation.
 * - `intro`: An "in" transition.
 * - `outro`: An "out" transition.
 */
type TweenTransitionType = 'idle' | 'intro' | 'outro';

/**
 * Represents the direction of a tween-based transition.
 * It can be either 'in' for intros or 'out' for outros.
 */
export type TweenTransitionDirection = Exclude<SvelteTransitionDirection, 'both'>;

type TweenTransitionBaseParams<UserData extends object> = {
	/**
	 * The element to which the transition is attached. This can be an `Element` instance,
	 * a CSS selector string, or a function that returns an `Element`. It is used for
	 * GSAP context scoping, event dispatching, and transition validation.
	 */
	attach?: Attach;
	/**
	 * When `true`, the transition's state is not updated, events are not dispatched,
	 * and pointer events are not managed. This effectively makes the transition inert.
	 */
	ignore?: boolean;
	/**
	 * An object containing custom data to be passed to the underlying transition function.
	 * This allows for creating highly configurable and reusable transitions.
	 */
	data?: Partial<UserData>;
};

/**
 * Defines the configuration parameters for a tween-based transition.
 * @template UserData - A generic type for custom data that can be passed to the transition logic.
 */
export type TweenTransitionParams<UserData extends object = object> =
	TweenTransitionBaseParams<UserData> & {
		/**
		 * If `true`, the transition will dispatch `introstart`/`introend` or `outrostart`/`outroend`
		 * custom events on the attached element, allowing for external logic to react to transition lifecycle.
		 */
		dispatchEvents?: boolean;
		/**
		 * If `true`, the transition completes instantly without any animation.
		 */
		instant?: boolean;
		/**
		 * When set, the transition will only execute if the attached element is within the viewport.
		 * A `boolean` value checks for any visibility, while a `number` (0-1) specifies the required
		 * visibility ratio.
		 */
		inViewport?: boolean | number;
		/**
		 * Determines the behavior when a new transition is triggered in the same direction as an ongoing one.
		 * - `prevent`: Ignores the new transition and allows the current one to complete.
		 * - `invalidate`: Reverts the current transition and starts the new one from the same progress point.
		 * - `restart`: Reverts the current transition and starts the new one from the beginning.
		 * - `add`: Allows the new transition to run concurrently with the existing one.
		 */
		overlapStrategy?: 'prevent' | 'invalidate' | 'restart' | 'add';
		/**
		 * If `true`, any previously running animation on the same element will be killed before
		 * the new transition starts, preventing conflicting animations.
		 */
		overwrite?: boolean;
	};

type TweenTransitionIdleParams<UserData extends object> = TweenTransitionBaseParams<UserData> & {
	/**
	 * The direction for the idle transition, either 'in' or 'out'.
	 */
	direction?: TweenTransitionDirection;
};

type TweenTransitionOptions<UserData extends object> = {
	/**
	 * Default parameters to apply to idle transitions.
	 */
	idle?: TweenTransitionIdleParams<UserData>;
	/**
	 * Default parameters to apply to intro transitions.
	 */
	intro?: TweenTransitionParams<UserData>;
	/**
	 * Default parameters to apply to outro transitions.
	 */
	outro?: TweenTransitionParams<UserData>;
	/**
	 * If `true`, all transitions created by this instance will be bypassed,
	 * effectively disabling them.
	 */
	bypass?: boolean;
} & TweenTransitionParams<UserData>;

type ResolvedTweenTransitionParams<UserData extends object> = Omit<
	Required<TweenTransitionParams<UserData>>,
	'attach'
> & {
	/**
	 * The resolved HTML element attached to the transition.
	 */
	attach: Element | null;
	/**
	 * Indicates whether the transition is currently being bypassed.
	 */
	bypass: boolean;
};

type TweenTransitionRecord<UserData extends object> = {
	/**
	 * The underlying GSAP animation instance for the transition.
	 */
	animation: gsap.core.Animation | null;
	/**
	 * The direction of the transition ('in' or 'out').
	 */
	direction: TweenTransitionDirection;
	/**
	 * The type of the transition ('idle', 'intro', or 'outro').
	 */
	type: TweenTransitionType;
	/**
	 * The starting progress ratio of the transition (0-1). This is used to handle
	 * overlapping transitions smoothly.
	 */
	ratio: number;
	/**
	 * The resolved parameters for the transition.
	 */
	params: ResolvedTweenTransitionParams<UserData>;
};

/**
 * Defines the parameters passed to the `TweenTransitionFunction`.
 * @template UserData - A generic type for custom data.
 */
export type TweenTransitionFunctionParams<UserData extends object = object> = Omit<
	TweenTransitionRecord<UserData>,
	'animation'
> & {
	/**
	 * A snapshot of the last transition record, providing context about the previous state.
	 */
	last: TweenTransitionRecord<UserData> | null;
};

/**
 * Defines the signature for a function that creates a GSAP-based tween transition.
 * @template UserData - A generic type for custom data.
 * @param params - The parameters required to create the transition animation.
 * @returns A GSAP animation instance (`gsap.core.Animation`) or `null`.
 */
export type TweenTransitionFunction<UserData extends object = object> = (
	params: TweenTransitionFunctionParams<UserData>
) => gsap.core.Animation | null;

/**
 * A comprehensive class for creating and managing complex, stateful tween-based transitions
 * using the GSAP library. It provides fine-grained control over transition behavior,
 * including lifecycle events, viewport-awareness, and overlapping animations.
 *
 * @template UserData - A generic type for a custom data object that can be passed to transitions.
 */
export class TweenTransition<UserData extends object = object> {
	private readonly _transition: TweenTransitionFunction<UserData>;
	private readonly _options: Readonly<TweenTransitionOptions<UserData>>;
	private readonly _records: Record<
		TweenTransitionDirection,
		TweenTransitionRecord<UserData> | null
	> = {
		in: null,
		out: null
	};

	private _qeuedIdle: TweenTransitionIdleParams<UserData> | null = null;
	private _allowIdle = false;
	private _animation: gsap.core.Animation | null = null;
	private _direction: TweenTransitionDirection | null = $state(null);
	private _ratio = $state(0);
	private _context = fromClient(
		() => gsap.context(() => {}),
		(c) => c.kill()
	);

	/**
	 * Constructs a new `TweenTransition` instance.
	 *
	 * @param transition - The function that defines the GSAP animation for the transition.
	 * @param options - Default configuration options for all transitions created by this instance.
	 */
	constructor(
		transition: TweenTransitionFunction<UserData>,
		options: TweenTransitionOptions<UserData> = {}
	) {
		this._transition = transition;
		this._options = options;

		this._init();
	}

	/**
	 * Validates whether a transition should proceed based on its direction and viewport visibility.
	 * This is a static utility method that can be used externally.
	 *
	 * @param node - The HTML element to be transitioned.
	 * @param direction - The direction of the transition ('in', 'out', or 'both').
	 * @param inViewport - If specified, checks if the element is within the viewport.
	 * @returns `true` if the transition is valid and should run, otherwise `false`.
	 */
	static validate(
		node: Element,
		direction: SvelteTransitionDirection,
		inViewport?: boolean | number
	): boolean {
		const resolvedDirection = resolveDirection(node, direction);
		const resolvedParams = resolveParams(resolvedDirection, { attach: node, inViewport });
		return !shouldSkipTransition(resolvedDirection, resolvedParams);
	}

	/**
	 * Creates a `TweenTransition` instance from a standard Svelte transition function.
	 * This allows adapting existing Svelte transitions to the `TweenTransition` system.
	 *
	 * @template Params - The type of the parameters for the Svelte transition function.
	 * @param transition - The Svelte transition function to adapt.
	 * @param options - Configuration options for the new `TweenTransition` instance.
	 * @returns A new `TweenTransition` instance.
	 */
	static from<Params extends object>(
		transition: SvelteTransitionFunction<Element, Partial<Params>>,
		options?: TweenTransitionOptions<Params>
	) {
		let lastEasing = linear;

		return new this<Params>(({ direction, ratio, params: { attach, data } }) => {
			if (!attach) {
				return null;
			}

			const reset = gsap.set(attach, {
				clearProps: 'all'
			});

			const {
				delay = 0,
				duration: d = 0,
				easing = linear,
				tick,
				css
			} = transition(attach, data, { direction });
			const keyframes: Record<string, object> = {};
			const start = lastEasing(ratio);
			const duration = d * (1 - start);

			lastEasing = easing;

			if (css) {
				const n = Math.ceil(duration / (1000 / 60));

				for (let i = 0; i <= n; i++) {
					const p = i / n;
					const e = start + (1 - start) * easing(p);
					const t = direction === 'in' ? e : 1 - e;
					const style = css(t, 1 - t);

					keyframes[p * 100 + '%'] = toKeyframe(style);
				}
			}

			reset.revert();

			const tween = gsap.to(attach, {
				delay: delay / 1000,
				duration: duration / 1000,
				ease: 'none',
				keyframes,
				onUpdate:
					tick &&
					(() => {
						const p = start + (1 - start) * easing(tween.progress());
						const t = direction === 'in' ? p : 1 - p;

						tick(t, 1 - t);
					})
			});

			return tween;
		}, options);
	}

	/**
	 * Reverts any active transitions and instantly renders the element in a specified
	 * direction ('in' or 'out'). This is useful for setting an initial state without animation.
	 *
	 * @param params - Parameters for the idle transition.
	 * @returns The GSAP animation instance created for the idle state, or `null`.
	 */
	idle = (params: TweenTransitionIdleParams<UserData> = {}): gsap.core.Animation | null => {
		return untrack(() => {
			if (!this._allowIdle) {
				this._qeuedIdle = params;
				return null;
			}

			const { idle = {}, ...options } = this._resolveOptions('idle');
			const direction = params.direction ?? idle.direction ?? 'out';
			const resolvedParams = resolveParams(
				null,
				{ ...params, instant: true, overlapStrategy: 'add' },
				options
			);

			this._context.revert();

			return this._executeTransition(direction, resolvedParams, true);
		});
	};

	/**
	 * Executes an "in" transition (intro).
	 *
	 * @param params - Configuration parameters for the intro transition.
	 * @returns The GSAP animation instance for the intro, or `null` if the transition is skipped.
	 */
	intro = (params: TweenTransitionParams<UserData> = {}): gsap.core.Animation | null => {
		return untrack(() => {
			this._handleIdle();

			const options = this._resolveOptions('intro');
			const resolvedParams = resolveParams('in', params, options);

			if (shouldSkipTransition('in', resolvedParams)) {
				return null;
			}

			return this._executeTransition('in', resolvedParams, false);
		});
	};

	/**
	 * Executes an "out" transition (outro).
	 *
	 * @param params - Configuration parameters for the outro transition.
	 * @returns The GSAP animation instance for the outro, or `null` if the transition is skipped.
	 */
	outro = (params: TweenTransitionParams<UserData> = {}): gsap.core.Animation | null => {
		return untrack(() => {
			this._handleIdle();

			const options = this._resolveOptions('outro');
			const resolvedParams = resolveParams('out', { inViewport: true, ...params }, options);

			if (shouldSkipTransition('out', resolvedParams)) {
				return null;
			}

			return this._executeTransition('out', resolvedParams, false);
		});
	};

	/**
	 * Returns the current progress ratio of the active transition (a value between 0 and 1).
	 *
	 * @returns The current transition ratio.
	 */
	ratio = (): number => {
		return this._ratio;
	};

	/**
	 * Returns the current direction of the active transition ('in', 'out', or `null` if no transition is active).
	 *
	 * @returns The current transition direction.
	 */
	direction = (): TweenTransitionDirection | null => {
		return this._direction;
	};

	/**
	 * Provides access to the currently active GSAP animation instance.
	 */
	get animation(): gsap.core.Animation | null {
		return this._animation;
	}

	/**
	 * Provides access to the initial options configured for this `TweenTransition` instance.
	 */
	get options(): Readonly<TweenTransitionOptions<UserData>> {
		return this._options;
	}

	private _init(): void {
		onMount(() => {
			this._handleIdle();
		});
	}

	private _handleIdle(): void {
		this._allowIdle = true;

		if (!this._qeuedIdle) return;

		this.idle(this._qeuedIdle);

		this._qeuedIdle = null;
	}

	private _resolveOptions(type: TweenTransitionType): TweenTransitionOptions<UserData> {
		return {
			...this._options,
			...this._options[type],
			data: { ...this._options.data, ...(this._options[type] && this._options[type].data) }
		};
	}

	private _executeTransition(
		direction: TweenTransitionDirection,
		params: ResolvedTweenTransitionParams<UserData>,
		idle: boolean
	): gsap.core.Animation | null {
		const { attach, dispatchEvents, instant, ignore, overlapStrategy, overwrite } = params;
		let ratio = 0;
		let resume: number | null = null;

		if (this._animation) {
			const progress = this._animation.progress();

			if (this._direction === direction) {
				if (overlapStrategy === 'prevent') return null;

				if (overlapStrategy === 'invalidate') {
					const lastDirection = this._direction === 'in' ? 'out' : 'in';
					const { params: { data, attach } = {} } = this._records[lastDirection] ?? {};

					this.idle({
						direction: lastDirection,
						attach: attach ?? undefined,
						ignore: true,
						data
					});

					resume = progress;
				} else if (overlapStrategy === 'add') {
					ratio = progress;
				} else if (overlapStrategy === 'restart') {
					this._animation.revert();
				}
			} else {
				ratio = 1 - progress;
			}

			if (overwrite) {
				this._animation.kill();
			}
		}

		const type = idle ? 'idle' : direction === 'in' ? 'intro' : 'outro';
		const animation = this._context.add(() => {
			return this._transition({
				last: this._direction && this._records[this._direction],
				type,
				direction,
				ratio,
				params
			});
		}, attach ?? undefined);

		const progress = instant ? 1 : resume;

		if (progress !== null && animation) {
			animation.progress(progress);
		}

		if (!ignore) {
			this._records[direction] = {
				animation,
				direction,
				params,
				ratio,
				type
			};

			if (attach && direction) {
				this._handlePointerEvents(attach, direction);

				if (dispatchEvents && animation) {
					this._dispatchEvents(attach, direction, animation);
				}
			}

			this._animation = animation;
			this._direction = direction;
			this._ratio = ratio;
		}

		return animation;
	}

	private _handlePointerEvents(attach: Element, direction: TweenTransitionDirection): void {
		gsap.set(
			attach,
			direction === 'out' ? { pointerEvents: 'none' } : { clearProps: 'pointerEvents' }
		);
	}

	private _dispatchEvents(
		attach: Element,
		direction: TweenTransitionDirection,
		animation: gsap.core.Animation
	): void {
		const startEvent = direction === 'in' ? 'introstart' : 'outrostart';
		const endEvent = direction === 'in' ? 'introend' : 'outroend';

		attach.dispatchEvent(new CustomEvent(startEvent));

		animation.then(() => {
			attach.dispatchEvent(new CustomEvent(endEvent));
		});
	}
}

const shouldSkipTransition = (
	direction: TweenTransitionDirection,
	params: ResolvedTweenTransitionParams<object>
): boolean => {
	const { instant, bypass, attach, inViewport } = params;

	return (
		bypass ||
		(direction === 'out' && instant) ||
		(inViewport !== undefined &&
			inViewport !== false &&
			!!attach &&
			!ScrollTrigger.isInViewport(attach, inViewport === true ? 0 : inViewport))
	);
};

const resolveDataFlag = (
	node: Element | null,
	key: string,
	direction: TweenTransitionDirection | null,
	fallback: boolean
): boolean => {
	let value = node && node.getAttribute('data-' + key);

	if (value === null && node) {
		const closest = node.closest(`[data-${key}]`);
		if (closest) value = closest.getAttribute('data-' + key);
	}
	if (value === null) return fallback;
	if (value === 'in') return direction === 'in';
	if (value === 'out') return direction === 'out';

	return value !== 'false';
};

const resolveAttach = (attach?: Attach): Element | null => {
	const selector = extract(attach) ?? null;
	return typeof selector === 'string' ? document.querySelector(selector) : selector;
};

const resolveParams = <UserData extends object>(
	direction: TweenTransitionDirection | null,
	params: TweenTransitionParams<UserData>,
	options: TweenTransitionOptions<UserData> = {}
): ResolvedTweenTransitionParams<UserData> => {
	const attach = resolveAttach(params.attach ?? options.attach);

	return {
		attach,
		dispatchEvents: params.dispatchEvents ?? options.dispatchEvents ?? false,
		instant: resolveDataFlag(
			attach,
			'instant',
			direction,
			params.instant ?? options.instant ?? false
		),
		bypass: resolveDataFlag(attach, 'bypass', direction, options.bypass ?? false),
		ignore: params.ignore ?? options.ignore ?? false,
		inViewport: params.inViewport ?? options.inViewport ?? false,
		overlapStrategy: params.overlapStrategy ?? options.overlapStrategy ?? 'prevent',
		overwrite: params.overwrite ?? options.overwrite ?? true,
		data: { ...options.data, ...params.data }
	};
};
