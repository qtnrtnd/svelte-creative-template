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
 * @template T The type of the function to debounce.
 * @param fn The function to debounce.
 * @param delay The debounce delay in milliseconds.
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

export const fromClient = <T>(create: () => T, cleanup?: (value: T) => void): T => {
	if (!browser) return undefined as T;

	const value = create();

	onDestroy(() => {
		if (cleanup) cleanup(value);
	});

	return value;
};

export type Extracted<T> = T extends () => infer R ? R : T;

export type Embedded<T, A extends unknown[] = unknown[]> = T | ((...args: A) => T);

export const extract = <T, A extends unknown[]>(value: Embedded<T, A>, ...args: A): Extracted<T> =>
	(typeof value === 'function' ? (value as (...args: A) => T)(...args) : value) as Extracted<T>;

/**
 * A utility to conditionally and safely merge Tailwind CSS classes.
 * It combines `clsx` for conditional class logic with `tailwind-merge`
 * to resolve conflicting Tailwind utility classes.
 *
 * @param inputs A list of class values, compatible with `clsx` (e.g., strings, objects, arrays).
 * @returns A single string of merged and optimized class names.
 */
export const mergeCls = (...inputs: ClassValue[]) => twMerge(clsx(...inputs));

/**
 * Combines multiple functions into a single new function.
 * When the returned function is called, it iterates through and calls each of the
 * provided functions with the same arguments, preserving the `this` context.
 *
 * @param fns An array of functions to merge. Null and undefined values are safely ignored.
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
 * @param value The value to convert, which can be a single item or an array.
 * @returns The value as an array.
 */
export const toArray = <T>(value: T | T[]): T[] => (Array.isArray(value) ? value : [value]);

/**
 * Updates the current URL's search parameters without a full page navigation.
 * It uses SvelteKit's `goto` with `replaceState: true` to modify the URL in place.
 * Setting a parameter's value to `null` will remove it from the URL.
 *
 * @param params An object where keys are the parameter names and values are the new parameter values.
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

export const toCamel = (str: string): string =>
	str.replace(/-([a-z])/g, (_, char) => char.toUpperCase());

// ---------------------------------------------------------------------

export const parseTag = (markup: string, tagName: string): string | null => {
	const regex = new RegExp(`<${tagName}\\b[^>]*>`, 'i');
	const match = markup.match(regex);
	return match ? match[0] : null;
};

export const parseAttributes = (markup: string, tagName: string): Record<string, string> => {
	const attributes: Record<string, string> = {};
	const tag = parseTag(markup, tagName);

	if (!tag) return attributes;

	const tagContent = tag.replace(new RegExp(`^<${tagName}\\b|>$`, 'gi'), '').trim();

	const attrRegex = /([^\s=]+)(?:=(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
	let match: RegExpExecArray | null;

	while ((match = attrRegex.exec(tagContent))) {
		const key = match[1];
		const value = match[2] ?? match[3] ?? match[4] ?? '';
		attributes[key] = value;
	}

	return attributes;
};

export const parseAttribute = (
	markup: string,
	tagName: string,
	attrName: string
): string | null => {
	const attributes = parseAttributes(markup, tagName);
	return attributes[attrName] ?? null;
};

export const parseContent = (markup: string, tagName: string): string | null => {
	const regex = new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)</${tagName}>`, 'i');
	const match = markup.match(regex);
	return match ? match[1] : null;
};

export const parseViewBox = (
	value: string
): { x: number; y: number; width: number; height: number } | null => {
	const parts = value.trim().split(/[\s,]+/);
	if (parts.length !== 4) return null;

	const [x, y, width, height] = parts.map(Number);
	return [x, y, width, height].every((n) => !isNaN(n)) ? { x, y, width, height } : null;
};

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

export const webgl2Supported = () => {
	try {
		const canvas = document.createElement('canvas');
		const gl = canvas.getContext('webgl2');

		return gl !== null;
	} catch {
		return false;
	}
};
