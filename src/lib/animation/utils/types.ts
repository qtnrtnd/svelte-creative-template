import type { TransitionConfig } from 'svelte/transition';

export type SvelteTransitionDirection = 'in' | 'out' | 'both';

export type SvelteTransitionOptions = { direction: SvelteTransitionDirection };

export type SvelteTransitionFunction<
	Node extends Element = Element,
	Params = unknown,
	Return extends TransitionConfig | (() => TransitionConfig) = TransitionConfig
> = (node: Node, params: Params, options: SvelteTransitionOptions) => Return;
