import type { Attachment } from 'svelte/attachments';
import { debounce } from './functions';
import { RESIZE_DEBOUNCE } from '$lib/const';
import { untrack } from 'svelte';

/**
 * Represents a single entry from an observer, combining types from Resize, Mutation,
 * and Intersection observers for versatile use.
 * @internal
 */
type ObserverEntry = ResizeObserverEntry & MutationRecord & IntersectionObserverEntry;

/**
 * A type definition for a Svelte attachment that connects an element to a browser
 * observer (`ResizeObserver`, `MutationObserver`, or `IntersectionObserver`).
 * This allows for reactive handling of changes to an element's size, attributes,
 * or visibility.
 *
 * @template T - The type of the observer ('resize', 'mutation', 'intersection').
 * @param type - The kind of observer to create.
 * @param fn - The callback function to execute when the observer detects a change.
 * @param options - Configuration options for the specific observer.
 * @returns A Svelte `Attachment` function.
 */
type ObserverAttachment = {
	(
		type: 'resize',
		fn: (entry: ResizeObserverEntry) => void,
		options?: ResizeObserverOptions
	): Attachment;
	(
		type: 'mutation',
		fn: (entry: MutationRecord) => void,
		options?: MutationObserverInit
	): Attachment;
	(
		type: 'intersection',
		fn: (entry: IntersectionObserverEntry) => void,
		options?: IntersectionObserverInit
	): Attachment;
	(
		type: 'resize' | 'mutation' | 'intersection',
		fn: (entry: ObserverEntry) => void,
		options?: ResizeObserverOptions | MutationObserverInit | IntersectionObserverInit
	): Attachment;
};

/**
 * A factory function that creates a Svelte `Attachment` for observing changes on an
 * HTML element. It simplifies the use of `ResizeObserver`, `MutationObserver`, and
 * `IntersectionObserver` within Svelte components.
 *
 * The `resize` observer is automatically debounced to prevent performance issues.
 *
 * @example
 * ```svelte
 * <script>
 *   import { observer } from '$lib/helpers';
 *
 *   const handleResize = (entry) => {
 *     console.log('Element resized:', entry.contentRect);
 *   };
 * </script>
 *
 * <div {@attach observer('resize', handleResize)}>
 *   Resize me!
 * </div>
 * ```
 *
 * @param type - The type of observer to attach ('resize', 'mutation', or 'intersection').
 * @param fn - The callback function to be executed on observation.
 * @param options - Optional configuration for the observer.
 * @returns A Svelte `Attachment` function that can be used with the `use:` directive.
 */
export const observer: ObserverAttachment = (type, fn, options) => {
	return (node) => {
		return untrack(() => {
			if (type === 'resize') {
				const observer = new ResizeObserver(
					debounce(([entry]) => fn(entry as ObserverEntry), RESIZE_DEBOUNCE)
				);
				observer.observe(node, options as ResizeObserverOptions);
				return () => observer.disconnect();
			}

			if (type === 'mutation') {
				const observer = new MutationObserver(([entry]) => fn(entry as ObserverEntry));
				observer.observe(node, options as MutationObserverInit);
				return () => observer.disconnect();
			}

			const observer = new IntersectionObserver(
				([entry]) => fn(entry as ObserverEntry),
				options as IntersectionObserverInit
			);
			observer.observe(node);
			return () => observer.disconnect();
		});
	};
};
