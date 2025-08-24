import {
	resolveTransition,
	type SvelteTransitionFactory,
	type SvelteTransitionFunction,
	type SvelteTransitionOptions
} from '$lib/animation';
import { type TransitionConfig } from 'svelte/transition';

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

export class PortalContext {
	private _transitions: { node?: Element; delay: number; duration: number }[] = [];

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
