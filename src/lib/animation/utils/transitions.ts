import { Flip } from 'gsap/Flip';
import { gsap } from 'gsap';
import type { TransitionConfig } from 'svelte/transition';
import {
	Crossfade,
	type CrossfadeTransition
} from '$lib/animation/core/Crossfade';
import {
	TweenTransitionAdapterConfig,
	type TweenTransitionAdapterFunction,
	type TweenTransitionAdapterParams
} from '$lib/animation/core/TweenTransitionAdapterConfig';
import type { TweenTransition } from '$lib/animation/core/TweenTransition.svelte';
import { getDistance, resolveTransition, type SvelteTransitionFactory } from './functions';
import type { SvelteTransitionOptions } from './types';

/**
 * A versatile Svelte transition that adapts a `TweenTransition` or a custom GSAP animation
 * function into a `TransitionConfig` object. This allows for the use of powerful, stateful
 * GSAP animations within Svelte's transition system.
 *
 * It can be used in three ways:
 * 1. With a `TweenTransition` instance for complex, state-aware transitions.
 * 2. With a `TweenTransitionAdapterFunction` for simpler, direct GSAP animations.
 * 3. With a `TweenTransitionAdapterParams` object for full configuration, including
 *    callbacks for lifecycle events like `onComplete`, `onInterrupt`, and `onResize`.
 *
 * @param node - The HTML element to which the transition is applied.
 * @param params - The transition configuration, which can be a `TweenTransition` instance,
 *                 a function, or a parameter object.
 * @param options - Svelte transition options, such as `direction`.
 * @returns A Svelte `TransitionConfig` object.
 */
export type TweenTransitionAdapter = {
	(
		node: Element,
		transition: TweenTransition | TweenTransitionAdapterFunction,
		options: SvelteTransitionOptions
	): TransitionConfig;
	(
		node: Element,
		params: TweenTransitionAdapterParams,
		options: SvelteTransitionOptions
	): TransitionConfig;
	(
		node: Element,
		params: TweenTransition | TweenTransitionAdapterFunction | TweenTransitionAdapterParams,
		options: SvelteTransitionOptions
	): TransitionConfig;
};

/**
 * A Svelte transition that wraps the `TweenTransitionAdapterConfig` to create tween-based
 * animations using GSAP. It normalizes the provided parameters and passes them to the
 * adapter to generate the final `TransitionConfig`.
 *
 * @param node - The HTML element to transition.
 * @param params - The parameters for the tween transition.
 * @param options - Svelte transition options.
 * @returns A Svelte `TransitionConfig` object.
 */
export const tween: TweenTransitionAdapter = (node, params, options) => {
	const normalized: TweenTransitionAdapterParams =
		'transition' in params ? params : { transition: params };

	return TweenTransitionAdapterConfig.create(node, normalized, options);
};

/**
 * A Svelte transition that conditionally applies another transition. If the provided
 * `transition` factory is `undefined`, it returns an empty transition configuration,
 * effectively disabling the transition.
 *
 * @param node - The HTML element to transition.
 * @param transition - A `SvelteTransitionFactory` or `undefined`.
 * @param options - Svelte transition options.
 * @returns A `TransitionConfig` object, which may be empty.
 */
export const optional = (
	node: HTMLElement,
	transition: SvelteTransitionFactory | undefined,
	options: SvelteTransitionOptions
) => {
	return typeof transition === 'function' ? resolveTransition(node, transition, options) : {};
};

/**
 * Defines the configuration variables for a Flip-based transition, extending GSAP's `Flip.FitVars`.
 */
interface FitTransitionVars extends Flip.FitVars {
	/**
	 * The duration of the transition. It can be a fixed number (in seconds) or a function
	 * that calculates the duration based on the distance between the transitioning elements.
	 */
	duration?: number | ((distance: number) => number);
}

const animatedFlipTransition =
	(direction: 'in' | 'out'): CrossfadeTransition<FitTransitionVars> =>
	({ item, counterpart, data }) => {
		const vars: FitTransitionVars = {
			duration(d: number) {
				return Math.sqrt(d) * 0.05;
			},
			scale: true,
			immediateRender: direction === 'in',
			runBackwards: direction === 'in',
			...data
		};

		if (typeof vars.duration === 'function') {
			const distance = getDistance(item, counterpart, 'edges');
			vars.duration = vars.duration(distance);
		}

		if (vars.absolute) {
			const parent = item.parentElement;
			const position = gsap.getProperty(item, 'position');

			if (parent && (position === 'static' || position === 'relative')) {
				const container = document.createElement('div');

				gsap.set(container, {
					width: item.offsetWidth,
					height: item.offsetHeight,
					position: 'relative'
				});

				parent.replaceChild(container, item);
				container.appendChild(item);
			}
		}

		return tween(
			item,
			{
				transition(node) {
					return Flip.fit(node, counterpart, {
						...vars,
						getVars: false
					}) as gsap.core.Tween | null;
				},
				onComplete() {
					if (direction === 'out') {
						gsap.set(counterpart, {
							clearProps: 'visibility'
						});
					}
				},
				onResize(node, { transition, animation, progress }) {
					if (animation) {
						animation.revert();
					}

					const newAnimation = transition(node);

					if (newAnimation) {
						newAnimation.progress(progress);
					}

					return newAnimation;
				},
				resizeTarget: document.documentElement,
				keepAlive: direction === 'in'
			},
			{
				direction
			}
		);
	};

const staticFlipTransition =
	(direction: 'in' | 'out'): CrossfadeTransition =>
	({ item }) => {
		return tween(
			item,
			(node) =>
				gsap.set(node, {
					visibility: 'hidden'
				}),
			{
				direction
			}
		);
	};

const [_leavingFlipOut, _leavingFlipIn] = Crossfade.create(
	animatedFlipTransition('out'),
	staticFlipTransition('in')
);

/**
 * A Svelte `out` transition where the **leaving** element animates to the position
 * and size of its incoming counterpart using GSAP's Flip plugin.
 *
 * This should be used on an element that is being removed from the DOM. It requires a
 * corresponding element using the `leavingFlipIn` transition with a matching `key`.
 *
 * @param node - The HTML element being removed.
 * @param params - An object containing the `key` to link to the counterpart, and optional
 *                 GSAP Flip `data` for customization.
 * @see leavingFlipIn
 */
export const leavingFlipOut = _leavingFlipOut;

/**
 * A Svelte `in` transition that makes the **incoming** element appear instantly without animation.
 *
 * This transition is the counterpart to `leavingFlipOut`. It handles the element
 * being added to the DOM, which appears statically while the outgoing element animates
 * towards it.
 *
 * @param node - The HTML element being added.
 * @param params - An object containing the `key` to link to the counterpart.
 * @see leavingFlipOut
 */
export const leavingFlipIn = _leavingFlipIn;

const [_enteringFlipOut, _enteringFlipIn] = Crossfade.create(
	staticFlipTransition('out'),
	animatedFlipTransition('in')
);

/**

 * A Svelte `out` transition that makes the **leaving** element disappear instantly.
 *
 * This transition is the counterpart to `enteringFlipIn`. It handles the element
 * being removed from the DOM, which is hidden while the incoming element animates
 * from its position.
 *
 * @param node - The HTML element being removed.
 * @param params - An object containing the `key` to link to the counterpart.
 * @see enteringFlipIn
 */
export const enteringFlipOut = _enteringFlipOut;

/**
 * A Svelte `in` transition where the **incoming** element animates from the position
 * and size of its leaving counterpart to its final state using GSAP's Flip plugin.
 *
 * This should be used on an element that is being added to the DOM. It requires a
 * corresponding element using the `enteringFlipOut` transition with a matching `key`.
 *
 * @param node - The HTML element being added.
 * @param params - An object containing the `key` to link to the counterpart, and optional
 *                 GSAP Flip `data` for customization.
 * @see enteringFlipOut
 */
export const enteringFlipIn = _enteringFlipIn;
