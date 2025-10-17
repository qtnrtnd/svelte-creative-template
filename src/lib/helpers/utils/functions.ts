import { onDestroy } from 'svelte';
import { twMerge } from 'tailwind-merge';
import clsx, { type ClassValue } from 'clsx';
import { page } from '$app/state';
import { goto } from '$app/navigation';
import { browser } from '$app/environment';
import { hyphen } from '$lib/const';
import { SvelteURL } from 'svelte/reactivity';

/**
 * Creates a debounced version of a function that delays invoking the original function
 * until after a specified wait time has passed since the last time it was called.
 *
 * @template T - The type of the function to debounce.
 * @param fn - The function to debounce.
 * @param delay - The debounce delay in milliseconds.
 * @returns The new debounced function.
 */
export const debounce = <T extends (...args: Parameters<T>) => ReturnType<T>>(
	fn: T,
	delay: number
): T => {
	let timeout: number;
	return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
		clearTimeout(timeout);
		timeout = setTimeout(() => fn.apply(this, args), delay);
	} as T;
};

/**
 * Executes a function only on the client-side, handling cleanup with `onDestroy`.
 * If called on the server, it returns `undefined`.
 *
 * @template T - The type of the value created by the function.
 * @param create - A function that creates the value.
 * @param cleanup - An optional function to clean up the created value when the component is destroyed.
 * @returns The created value on the client, or `undefined` on the server.
 */
export const fromClient = <T>(create: () => T, cleanup?: (value: T) => void): T => {
	if (!browser) return undefined as T;

	const value = create();

	onDestroy(() => {
		if (cleanup) cleanup(value);
	});

	return value;
};

/**
 * A utility type that extracts the return type of a function, or returns the type itself if it's not a function.
 *
 * @template T - The type to extract from.
 */
export type Extracted<T> = T extends () => infer R ? R : T;

/**
 * A utility type that represents a value that can either be of type `T` or a function that returns `T`.
 *
 * @template T - The underlying type.
 * @template A - The arguments for the function variant.
 */
export type Embedded<T, A extends unknown[] = unknown[]> = T | ((...args: A) => T);

/**
 * Extracts a value from an `Embedded` type. If the value is a function, it is called with the provided arguments.
 * Otherwise, the value is returned directly.
 *
 * @template T - The underlying type.
 * @template A - The arguments for the function variant.
 * @param value - The `Embedded` value to extract.
 * @param args - The arguments to pass if `value` is a function.
 * @returns The extracted value of type `T`.
 */
export const extract = <T, A extends unknown[]>(value: Embedded<T, A>, ...args: A): Extracted<T> =>
	(typeof value === 'function' ? (value as (...args: A) => T)(...args) : value) as Extracted<T>;

/**
 * A utility to conditionally and safely merge Tailwind CSS classes.
 * It combines `clsx` for conditional class logic with `tailwind-merge`
 * to resolve conflicting Tailwind utility classes.
 *
 * @param inputs - A list of class values, compatible with `clsx` (e.g., strings, objects, arrays).
 * @returns A single string of merged and optimized class names.
 */
export const mergeCls = (...inputs: ClassValue[]) => twMerge(clsx(...inputs));

/**
 * Combines multiple functions into a single new function.
 * When the returned function is called, it iterates through and calls each of the
 * provided functions with the same arguments, preserving the `this` context.
 *
 * @param fns - An array of functions to merge. Null and undefined values are safely ignored.
 * @returns A new function that delegates calls to all input functions.
 */
export const mergeFns = <F extends (...args: never[]) => void>(
	...fns: (F | null | undefined)[]
): F => {
	return function (this: unknown, ...args: Parameters<F>): void {
		for (const fn of fns) {
			if (typeof fn === 'function') {
				fn.apply(this, args);
			}
		}
	} as F;
};

/**
 * Ensures a value is an array.
 * If the input is already an array, it is returned as-is. If it is a single
 * value, it is wrapped in a new array.
 *
 * @param value - The value to convert, which can be a single item or an array.
 * @returns The value as an array.
 */
export const toArray = <T>(value: T | T[]): T[] => (Array.isArray(value) ? value : [value]);

/**
 * Updates the current URL's search parameters without a full page navigation.
 * It uses SvelteKit's `goto` with `replaceState: true` to modify the URL in place.
 * Setting a parameter's value to `null` will remove it from the URL.
 *
 * @param params - An object where keys are the parameter names and values are the new parameter values.
 */
export const setParams = (params: Record<string, string | number | boolean | null>) => {
	const url = new SvelteURL(page.url);

	for (const param in params) {
		const value = params[param];
		if (value === null) url.searchParams.delete(param);
		else url.searchParams.set(param, value.toString());
	}

	goto(url.href, { replaceState: true });
};

/**
 * Creates a function that can only be called once.
 * Subsequent calls will be ignored. An optional validator can be provided to
 * conditionally allow the function to be called.
 *
 * @template This - The `this` context of the function.
 * @template Args - The arguments of the function.
 * @param fn - The function to be called once.
 * @param validator - An optional function that must return true for the function to be called.
 * @returns A new function that can only be called once.
 */
export const once = <This, Args extends unknown[]>(
	fn: (this: This, ...args: Args) => void,
	validator?: (this: This, ...args: Args) => boolean
): ((this: This, ...args: Args) => void) => {
	let called = false;

	return function (this: This, ...args: Args): void {
		if (called) return;

		if (validator && !validator.apply(this, args)) {
			return;
		}

		called = true;
		fn.apply(this, args);
	};
};

/**
 * Converts a kebab-case string to camelCase.
 *
 * @param str - The kebab-case string to convert.
 * @returns The camelCase version of the string.
 */
export const toCamel = (str: string): string =>
	str.replace(/-([a-z])/g, (_, char) => char.toUpperCase());

/**
 * Hyphenates a string and wraps each part in a `<span>` for styling soft hyphens.
 *
 * @param string - The string to hyphenate.
 * @returns An HTML string with hyphenated words wrapped in spans.
 */
export const hyphenateCls = (string: string) => {
	return hyphen
		.hyphenateSync(string)
		.split(/(\s+)/)
		.map((word) => {
			if (!word.trim()) return word;

			const parts = word.split('\u00AD');

			return parts
				.map((chunk, index) => {
					if (!chunk) return '';

					const isShy = index < parts.length - 1;
					const cls = isShy ? ' class="shy"' : '';

					return `<span${cls}>${chunk}</span>`;
				})
				.join('');
		})
		.join('');
};

export const chunkArray = <T>(array: T[], size: number): T[][] =>
	Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
		array.slice(i * size, i * size + size)
	);

export const chunkByLength = (items: string[], maxLength: number): string[][] => {
	const result: string[][] = [];
	let currentChunk: string[] = [];
	let currentLength = 0;

	for (const item of items) {
		const itemLength = item.length;

		// If adding this item exceeds the maxLength, start a new chunk
		if (currentLength + itemLength > maxLength && currentChunk.length > 0) {
			result.push(currentChunk);
			currentChunk = [item];
			currentLength = itemLength;
		} else {
			currentChunk.push(item);
			currentLength += itemLength;
		}
	}

	if (currentChunk.length > 0) {
		result.push(currentChunk);
	}

	return result;
};

// export const toSpan = (string: string, options: { className?: string } = {}) => {
// 	const words = string.split(/\s+/);
// 	return words
// 		.map((word, i) => `<span>${word + (i < words.length - 1 ? '&nbsp;' : '')}</span>`)
// 		.join('');
// }
