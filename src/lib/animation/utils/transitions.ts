import { gsap, Flip } from '$lib/gsap';
import { Crossfade, type CrossfadeTransition } from '../core/Crossfade';
import { getDistance, resolveTransition, type SvelteTransitionFactory } from './functions';
import {
	TweenTransitionAdapterConfig,
	type TweenTransitionAdapterFunction,
	type TweenTransitionAdapterParams
} from '../core/TweenTransitionAdapterConfig';
import type { TransitionConfig } from 'svelte/transition';
import type { TweenTransition } from '../core/TweenTransition.svelte';
import type { SvelteTransitionOptions } from './types';

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

export const tween: TweenTransitionAdapter = (node, params, options) => {
	const normalized: TweenTransitionAdapterParams =
		'transition' in params ? params : { transition: params };

	return TweenTransitionAdapterConfig.create(node, normalized, options);
};

export const optional = (
	node: HTMLElement,
	transition: SvelteTransitionFactory | undefined,
	options: SvelteTransitionOptions
) => {
	return typeof transition === 'function' ? resolveTransition(node, transition, options) : {};
};

interface FitTransitionVars extends Flip.FitVars {
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
 * and size of its incoming counterpart.
 *
 * This should be used on the element that is being removed from the DOM.
 * It requires a corresponding element using the `leavingFlipIn` transition with a matching `key`.
 *
 * @param node The element being removed.
 * @param params An object containing the `key` to link to the counterpart, and optional GSAP Flip `data`.
 * @see leavingFlipIn
 */
export const leavingFlipOut = _leavingFlipOut;

/**
 * A Svelte `in` transition that makes the **incoming** element appear instantly.
 *
 * This transition is the counterpart to `leavingFlipOut`. It handles the element
 * being added to the DOM, which appears statically while the outgoing element animates.
 *
 * @param node The element being added.
 * @param params An object containing the `key` to link to the counterpart.
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
 * being removed from the DOM, which is hidden while the incoming element animates.
 *
 * @param node The element being removed.
 * @param params An object containing the `key` to link to the counterpart.
 * @see enteringFlipIn
 */
export const enteringFlipOut = _enteringFlipOut;

/**
 * A Svelte `in` transition where the **incoming** element animates from the position
 * and size of its leaving counterpart to its final state.
 *
 * This should be used on the element that is being added to the DOM.
 * It requires a corresponding element using the `enteringFlipOut` transition with a matching `key`.
 *
 * @param node The element being added.
 * @param params An object containing the `key` to link to the counterpart, and optional GSAP Flip `data`.
 * @see enteringFlipOut
 */
export const enteringFlipIn = _enteringFlipIn;
