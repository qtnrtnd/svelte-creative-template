import type { TransitionConfig } from 'svelte/transition';
import type { SvelteTransitionOptions } from '../utils/types';
import { TweenTransition } from './TweenTransition.svelte';
import { resolveTransition, type SvelteTransitionFactory } from '../utils/functions';

type CrossfadeParams<UserData> = {
	key: string;
	fallback?: SvelteTransitionFactory;
} & (UserData extends void ? object : { data?: UserData });

type CrossfadeTransitionOptions<UserData> = CrossfadeParams<UserData> & {
	item: HTMLElement;
	counterpart: HTMLElement;
};

export type CrossfadeTransition<UserData = void> = (
	options: CrossfadeTransitionOptions<UserData>
) => TransitionConfig;

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
