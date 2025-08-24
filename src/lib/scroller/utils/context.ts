import { getContext, setContext } from 'svelte';
import { ScrollSmoother } from '$lib/gsap';
import { fromClient } from '$lib/helpers';

const contextKey = Symbol('scroller');

export const createScrollerContext = (options: ScrollSmoother.Vars = {}) => {
	return setContext(
		contextKey,
		fromClient(
			() => ScrollSmoother.create(options),
			(s) => s.kill()
		)
	);
};

export const useScroller = () => {
	return getContext<ScrollSmoother>(contextKey);
};
