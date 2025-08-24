import type { Attachment } from 'svelte/attachments';
import { debounce } from './functions';
import { RESIZE_DEBOUNCE } from '$lib/const';
import { untrack } from 'svelte';

type ObserverEntry = ResizeObserverEntry & MutationRecord & IntersectionObserverEntry;

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
