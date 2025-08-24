import { Hook } from '../core/Hook';

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

export const onResize = Hook.create();

export const onScroll = Hook.create<[ScrollSmoother]>();

export const beforeSwap = Hook.create<
	[
		{
			leaving: Element;
			swap: Promise<void>;
		}
	]
>();

export const onSwap = Hook.create<
	[
		{
			leaving: Element;
			entering: Element;
			swap: Promise<void>;
		}
	]
>();

export const afterSwap = Hook.create<[{ entering: Element }]>();
