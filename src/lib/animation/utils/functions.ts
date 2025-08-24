import type { TransitionConfig } from 'svelte/transition';
import type {
	SvelteTransitionDirection,
	SvelteTransitionFunction,
	SvelteTransitionOptions
} from './types';
import { toCamel } from '$lib/helpers';

/**
 * Factory function for creating Svelte transitions with a fluent API
 * @template Node - Element type the transition applies to
 * @template Return - Return type (TransitionConfig or function returning TransitionConfig)
 */
export type SvelteTransitionFactory<
	Node extends Element = Element,
	Return extends (() => TransitionConfig) | TransitionConfig = TransitionConfig
> = (
	t: <Params>(
		transition: SvelteTransitionFunction<Node, Params, Return>,
		...params: Params extends undefined ? [] : [Params]
	) => Return
) => Return;

/**
 * Calculates the distance between two elements
 * @param el1 - First element
 * @param el2 - Second element
 * @param mode - Calculation mode: 'center' for center-to-center, 'edges' for edge-to-edge
 * @returns Distance in pixels
 */
export const getDistance = (
	el1: Element,
	el2: Element,
	mode: 'center' | 'edges' = 'center'
): number => {
	const rect1 = el1.getBoundingClientRect();
	const rect2 = el2.getBoundingClientRect();

	if (mode === 'center') {
		const x1 = rect1.left + rect1.width / 2;
		const y1 = rect1.top + rect1.height / 2;
		const x2 = rect2.left + rect2.width / 2;
		const y2 = rect2.top + rect2.height / 2;
		return Math.hypot(x2 - x1, y2 - y1);
	} else {
		const dx = Math.max(rect1.left - rect2.right, rect2.left - rect1.right, 0);
		const dy = Math.max(rect1.top - rect2.bottom, rect2.top - rect1.bottom, 0);
		return Math.hypot(dx, dy);
	}
};

/**
 * Distributes a value across a specified count with optional easing
 * @param count - Number of values to generate
 * @param value - Base value to distribute
 * @param ease - Easing function to apply (defaults to linear)
 * @returns Array of distributed values
 */
export const distribute = (
	count: number,
	value: number,
	ease: (n: number) => number = (n) => n
): number[] => {
	const values = new Array<number>();

	for (let i = 0; i < count; i++) {
		const t = count <= 1 ? 0 : i / (count - 1);
		values.push(ease(t) * count * value);
	}

	return values;
};

/**
 * Interpolates a value based on a ratio and multiplier
 * @param value - Base value
 * @param multiply - Multiplier for the final value
 * @param ratio - Interpolation ratio (0-1)
 * @returns Interpolated value
 */
export const fromRatio = (value: number, multiply: number, ratio: number) => {
	return value * (1 + (multiply - 1) * ratio);
};

/**
 * Resolves transition direction based on element state and provided direction
 * @param node - Element to check
 * @param direction - Requested transition direction
 * @returns Resolved direction ('in' or 'out')
 */
export const resolveDirection = (
	node: Element,
	direction: SvelteTransitionDirection
): Exclude<SvelteTransitionDirection, 'both'> => {
	if (direction === 'in' || direction === 'out') {
		return direction;
	}
	return node.getAttribute('inert') !== null ? 'out' : 'in';
};

/**
 * Converts a CSS style string to a keyframe object with camelCase properties
 * @param style - CSS style string (e.g., "opacity: 0; transform: scale(0.5)")
 * @returns Object with camelCase CSS properties
 */
export const toKeyframe = (style: string): Record<string, string> => {
	return Object.fromEntries(
		style
			.split(';')
			.filter(Boolean)
			.map((rule) => {
				const [key, value] = rule.split(':').map((part) => part.trim());
				return [toCamel(key), value];
			})
	);
};

/**
 * Resolves a transition factory by providing it with a transition function executor
 * @param node - Element to apply transition to
 * @param factory - Transition factory function
 * @param options - Svelte transition options
 * @returns Resolved transition result
 */
export const resolveTransition = <
	Node extends Element,
	Return extends (() => TransitionConfig) | TransitionConfig
>(
	node: Node,
	factory: SvelteTransitionFactory<Node, Return>,
	options: SvelteTransitionOptions
): Return => {
	return factory((transition, ...[params]) => {
		return transition(node, params!, options);
	});
};
