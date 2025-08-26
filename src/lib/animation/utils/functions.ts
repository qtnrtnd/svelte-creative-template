import type { TransitionConfig } from 'svelte/transition';
import { toCamel } from '$lib/helpers';
import type {
	SvelteTransitionDirection,
	SvelteTransitionFunction,
	SvelteTransitionOptions
} from './types';

/**
 * Defines a factory for creating Svelte transitions with a fluent and composable API.
 * This allows for defining reusable transition logic that can be easily configured.
 *
 * @template Node - The type of the HTML element to which the transition applies.
 * @template Return - The return type, which can be a `TransitionConfig` or a function that returns one.
 * @param t - A function that takes a Svelte transition function and its parameters, and returns the configured transition.
 * @returns The result of the transition factory, either a `TransitionConfig` or a function returning it.
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
 * Calculates the geometric distance between two HTML elements.
 *
 * @param el1 - The first HTML element.
 * @param el2 - The second HTML element.
 * @param mode - The calculation mode: 'center' for center-point to center-point distance,
 *               or 'edges' for the distance between the nearest edges of the elements.
 * @returns The distance between the two elements in pixels.
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
 * Distributes a given value across a specified number of steps, with an optional easing function.
 * This is useful for creating staggered animations.
 *
 * @param count - The number of values to generate.
 * @param value - The base value to be distributed.
 * @param ease - An optional easing function to apply to the distribution. Defaults to linear.
 * @returns An array of numbers representing the distributed values.
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
 * Interpolates a value based on a given ratio and a multiplier.
 * This can be used to scale a value proportionally.
 *
 * @param value - The base value to be interpolated.
 * @param multiply - The multiplier to apply to the value.
 * @param ratio - The interpolation ratio, typically between 0 and 1.
 * @returns The interpolated value.
 */
export const fromRatio = (value: number, multiply: number, ratio: number) => {
	return value * (1 + (multiply - 1) * ratio);
};

/**
 * Resolves the direction of a Svelte transition ('in' or 'out') based on the element's state
 * and the provided direction, which can be 'in', 'out', or 'both'.
 *
 * @param node - The HTML element undergoing the transition.
 * @param direction - The requested transition direction.
 * @returns The resolved direction, either 'in' or 'out'.
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
 * Converts a CSS style string into a keyframe object suitable for use with GSAP or other
 * animation libraries. It transforms CSS property names to camelCase.
 *
 * @param style - A CSS style string (e.g., "opacity: 0; transform: scale(0.5)").
 * @returns An object where keys are camelCased CSS properties and values are their corresponding values.
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
 * Resolves a `SvelteTransitionFactory` by executing it with the provided node and options.
 * This function acts as a bridge between the factory pattern and the actual Svelte transition execution.
 *
 * @template Node - The type of the HTML element.
 * @template Return - The expected return type from the factory.
 * @param node - The HTML element to apply the transition to.
 * @param factory - The transition factory function to be resolved.
 * @param options - The Svelte transition options.
 * @returns The result of the resolved transition.
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
