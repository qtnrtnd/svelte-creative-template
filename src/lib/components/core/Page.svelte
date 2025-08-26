<script lang="ts">
	import { gsap, ScrollTrigger } from '$lib/gsap';
	import { onDestroy, onMount, type Snippet } from 'svelte';
	import { useApp, useInterface } from '$lib/states';
	import { useScroller } from '$lib/scroller';
	import { createSuspenseContext } from '$lib/suspense';
	import { type SvelteTransitionFunction } from '$lib/animation';
	import { mergeCls, once } from '$lib/helpers';
	import { afterSwap, onSwap, beforeSwap } from '$lib/hooks';
	import { usePortal } from '$lib/portal';
	import type { EventHandler, HTMLAttributes } from 'svelte/elements';
	import type { TransitionConfig } from 'svelte/transition';
	import { browser } from '$app/environment';

	const {
		children,
		...props
	}: {
		/** The content of the page. */
		children: Snippet;
	} = $props();

	const scroller = useScroller();
	const { keepAlive } = usePortal();
	const { swapOffset } = useInterface();
	const { frozen, scrollPaused, swapping, swap, initial } = useApp();

	createSuspenseContext({
		scope: 'page',
		final: true,
		suspendState: swapping
	});

	let currentPageEl: HTMLElement;

	const getPageEl = (state: 'entering' | 'leaving') => {
		return document.querySelector<HTMLElement>(`[data-page="${state}"]`);
	};

	const outroHandler: EventHandler = async () => {
		for (const scrollTrigger of ScrollTrigger.getAll()) {
			if (scrollTrigger.trigger && currentPageEl.contains(scrollTrigger.trigger)) {
				scrollTrigger.disable();
			}
		}

		const offset = -scroller.scrollTop();

		gsap.set(currentPageEl, {
			marginTop: offset
		});

		scroller.scrollTop(0);

		swapOffset(offset);
		scrollPaused(true);
		frozen(true);
	};

	const outro: SvelteTransitionFunction<Element, unknown, () => TransitionConfig> = (...params) => {
		const resolvers = Promise.withResolvers<void>();

		beforeSwap.dispatch({ leaving: currentPageEl, swap: resolvers.promise });

		currentPageEl.dataset.page = 'leaving';

		swapping(true);
		swap(resolvers);

		return keepAlive(...params);
	};

	onMount(() => {
		if (initial) {
			afterSwap.dispatch({ entering: currentPageEl });
			swap().resolve();
			return;
		}

		const leavingPageEl = getPageEl('leaving');
		if (!leavingPageEl) return;

		gsap.set(currentPageEl, {
			position: 'absolute',
			top: Math.abs(swapOffset()),
			left: 0,
			width: '100%'
		});

		ScrollTrigger.refresh();

		onSwap.dispatch({
			leaving: leavingPageEl,
			entering: currentPageEl,
			swap: swap().promise
		});
	});

	onDestroy(() => {
		if (!browser) return;

		const enteringPageEl = getPageEl('entering');
		if (!enteringPageEl) return;

		gsap.set(enteringPageEl, {
			clearProps: 'all'
		});

		ScrollTrigger.refresh();

		swapping(false);
		swapOffset(0);

		afterSwap.dispatch({ entering: enteringPageEl });
		swap().resolve();
	});
</script>

<div
	bind:this={currentPageEl}
	out:outro|global
	onoutrostartcapture={once(outroHandler, ({ target, currentTarget }) => {
		return swapping() && target !== currentTarget;
	})}
	data-page="entering"
>
	{@render children()}
</div>
