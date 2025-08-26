import type { ScrollTrigger } from '$lib/gsap';
import { Hook } from '../core/Hook';

/**
 * Executes a callback function when a given DOM element is removed from the document.
 * It uses a `MutationObserver` to efficiently detect the removal.
 *
 * @param node - The DOM element to monitor for removal.
 * @param fn - The callback function to execute upon removal.
 */
export const onRemove = (node: Element, fn: () => void): void => {
	if (!node.isConnected) {
		fn();
		return;
	}

	const observer = new MutationObserver((mutations) => {
		for (const mutation of mutations) {
			if (mutation.type === 'childList') {
				for (const removedNode of mutation.removedNodes) {
					if (removedNode === node || removedNode.contains(node)) {
						observer.disconnect();
						fn();
						return;
					}
				}
			}
		}
	});

	observer.observe(document.body, {
		childList: true,
		subtree: true
	});
};

/**
 * A global hook that is dispatched when the window is resized.
 * Listeners can subscribe to this hook to react to changes in viewport dimensions.
 */
export const onResize = Hook.create();

/**
 * A global hook that is dispatched during scroll events, providing the `ScrollSmoother` instance.
 *
 * @param smoother - The `ScrollSmoother` instance managing the scroll behavior.
 */
export const onScroll = Hook.create<[ScrollSmoother]>();

/**
 * A hook that is dispatched just before a page swap transition begins.
 * It provides the leaving element and a promise that resolves when the swap is complete.
 *
 * @param payload - An object containing the `leaving` element and the `swap` promise.
 */
export const beforeSwap = Hook.create<
	[
		{
			leaving: Element;
			swap: Promise<void>;
		}
	]
>();

/**
 * A hook that is dispatched during a page swap, when both the leaving and entering
 * elements are present in the DOM.
 *
 * @param payload - An object containing the `leaving` and `entering` elements, and the `swap` promise.
 */
export const onSwap = Hook.create<
	[
		{
			leaving: Element;
			entering: Element;
			swap: Promise<void>;
		}
	]
>();

/**
 * A hook that is dispatched before a `ScrollTrigger` instance is refreshed.
 *
 * @param trigger - The `ScrollTrigger` instance that is about to be refreshed.
 */
export const beforeRefresh = Hook.create<[ScrollTrigger]>();

/**
 * A hook that is dispatched after a `ScrollTrigger` instance has been refreshed.
 *
 * @param trigger - The `ScrollTrigger` instance that has been refreshed.
 */
export const onRefresh = Hook.create<[ScrollTrigger]>();

/**
 * A hook that is dispatched after a page swap transition has completed and the
 * new page's entering element is settled.
 *
 * @param payload - An object containing the `entering` element.
 */
export const afterSwap = Hook.create<[{ entering: Element }]>();
