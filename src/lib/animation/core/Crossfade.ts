import type { TransitionConfig } from 'svelte/transition';
import type { SvelteTransitionOptions } from '../utils/types';
import { TweenTransition } from './TweenTransition.svelte';
import { resolveTransition, type SvelteTransitionFactory } from '../utils/functions';

/**
 * Defines the parameters for a crossfade transition.
 * @template UserData - The type of custom data that can be passed to the transition.
 */
type CrossfadeParams<UserData> = {
	/**
	 * A unique identifier used to pair elements for the crossfade effect.
	 * The element being removed and the element being added must share the same key.
	 */
	key: string;
	/**
	 * A fallback transition to be executed if the crossfade validation fails.
	 * This ensures a graceful degradation if a counterpart element is not found.
	 */
	fallback?: SvelteTransitionFactory;
} & (UserData extends void ? object : { data?: UserData });

/**
 * Defines the options passed to the crossfade transition function.
 * @template UserData - The type of custom data associated with the transition.
 */
type CrossfadeTransitionOptions<UserData> = CrossfadeParams<UserData> & {
	/**
	 * The HTML element that is part of the current transition (either being sent or received).
	 */
	item: HTMLElement;
	/**
	 * The counterpart HTML element in the crossfade. For a 'send' transition, this is the
	 * element being received, and for a 'receive' transition, it's the one being sent.
	 */
	counterpart: HTMLElement;
};

/**
 * Defines the signature for a function that returns a Svelte transition configuration
 * for a crossfade effect.
 *
 * @template UserData - The type of custom data the transition can accept.
 * @param options - The configuration options for the crossfade transition.
 * @returns A Svelte `TransitionConfig` object that defines the animation.
 */
export type CrossfadeTransition<UserData = void> = (
	options: CrossfadeTransitionOptions<UserData>
) => TransitionConfig;

/**
 * A class that facilitates creating a pair of synchronized transitions for a smooth
 * crossfade effect between two elements. It manages the pairing of elements based on a key.
 *
 * @template SendUserData - The type of data to be passed during the 'send' (outro) transition.
 * @template ReceiveUserData - The type of data to be passed during the 'receive' (intro) transition.
 */
export class Crossfade<SendUserData = void, ReceiveUserData = void> {
	private readonly _toSend = new Map<string, HTMLElement>();
	private readonly _toReceive = new Map<string, HTMLElement>();

	private constructor(
		private _sendTransition: (
			options: CrossfadeTransitionOptions<SendUserData>
		) => TransitionConfig,
		private _receiveTransition: (
			options: CrossfadeTransitionOptions<ReceiveUserData>
		) => TransitionConfig
	) {}

	/**
	 * Creates and returns a pair of crossfade transitions: one for the element being
	 * removed ('send') and one for the element being added ('receive').
	 *
	 * @param sendTransition - The transition function for the element that is being removed.
	 * @param receiveTransition - The transition function for the element that is being added.
	 * @returns A tuple containing the `send` and `receive` transition functions, respectively.
	 */
	static create<SendUserData = void, ReceiveUserData = void>(
		sendTransition: (options: CrossfadeTransitionOptions<SendUserData>) => TransitionConfig,
		receiveTransition: (options: CrossfadeTransitionOptions<ReceiveUserData>) => TransitionConfig
	) {
		const crossfade = new this<SendUserData, ReceiveUserData>(sendTransition, receiveTransition);

		return [
			crossfade._getTransition(crossfade._toSend, crossfade._toReceive, crossfade._sendTransition),
			crossfade._getTransition(
				crossfade._toReceive,
				crossfade._toSend,
				crossfade._receiveTransition
			)
		] as const;
	}

	private _getTransition<UserData>(
		items: Map<string, HTMLElement>,
		counterparts: Map<string, HTMLElement>,
		transition: (options: CrossfadeTransitionOptions<UserData>) => TransitionConfig
	): (
		node: HTMLElement,
		params: CrossfadeParams<UserData>,
		options: SvelteTransitionOptions
	) => () => TransitionConfig {
		return (node, params, options) => {
			items.set(params.key, node);

			return () => {
				const target = counterparts.get(params.key);

				if (target) {
					counterparts.delete(params.key);

					if (TweenTransition.validate(node, options.direction, 1)) {
						return transition({ item: node, counterpart: target, ...params });
					}
				}

				items.delete(params.key);

				return params.fallback ? resolveTransition(node, params.fallback, options) : {};
			};
		};
	}
}
