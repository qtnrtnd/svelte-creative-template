import {
	resolveTransition,
	type SvelteTransitionFactory,
	type SvelteTransitionFunction,
	type SvelteTransitionOptions
} from '$lib/animation';
import { type TransitionConfig } from 'svelte/transition';

/**
 * A versatile function type for tracking animations within a `PortalContext`.
 * It can be used in two ways:
 * 1. As a Svelte transition wrapper that registers the transition's duration and delay.
 * 2. As a direct animation tracker for GSAP animations.
 * @internal
 */
type TrackAnimation = {
	(
		node: Element,
		factory: SvelteTransitionFactory,
		options?: SvelteTransitionOptions
	): TransitionConfig;

	<Animation extends gsap.core.Animation | null>(animation: Animation): Animation;

	<Animation extends gsap.core.Animation | null>(
		nodeOrAnimation: Element | Animation,
		factory?: SvelteTransitionFactory,
		options?: SvelteTransitionOptions
	): TransitionConfig | Animation;
};

/**
 * Manages the state and behavior of transitions within a `Portal` component.
 * Its primary role is to track the durations of outgoing animations to determine
 * how long a portal's content should be "kept alive" during a page transition,
 * ensuring that animations can complete before the element is removed from the DOM.
 */
export class PortalContext {
	/**
	 * A list of active transitions, storing their delays and durations.
	 * @private
	 */
	private _transitions: { node?: Element; delay: number; duration: number }[] = [];

	/**
	 * A function that tracks animations to calculate the total duration for `keepAlive`.
	 * It can wrap a Svelte transition or a GSAP animation instance. When an `out`
	 * transition is tracked, its delay and duration are recorded.
	 */
	trackAnimation: TrackAnimation = <Animation extends gsap.core.Animation | null>(
		nodeOrAnimation: Element | Animation,
		transition?: SvelteTransitionFactory,
		options?: SvelteTransitionOptions
	): TransitionConfig | Animation => {
		if (!nodeOrAnimation) {
			return nodeOrAnimation;
		}

		if ('delay' in nodeOrAnimation) {
			const delay = nodeOrAnimation.delay() * 1000;
			const duration = nodeOrAnimation.duration() * 1000;

			this._transitions.push({ delay, duration });

			return nodeOrAnimation;
		} else if (!transition || !options) {
			return {};
		}

		const {
			delay = 0,
			duration = 0,
			...config
		} = resolveTransition(nodeOrAnimation, transition, options);

		if (options.direction !== 'in') {
			this._transitions.push({ node: nodeOrAnimation, delay, duration });
		}

		return {
			delay,
			duration,
			...config
		};
	};

	/**
	 * A Svelte transition function that calculates the maximum duration of all tracked
	 * `out` transitions and uses it to keep the portal's content in the DOM until
	 * all animations have finished. This is crucial for preventing elements from
	 * being prematurely removed during page transitions.
	 */
	keepAlive: SvelteTransitionFunction<Element, unknown, () => TransitionConfig> = () => {
		return () => {
			const duration = Math.max(
				0,
				...this._transitions.map(({ node, delay, duration }) => {
					return !node || node.isConnected ? delay + duration : 0;
				})
			);
			this._transitions = [];
			return { duration };
		};
	};
}
