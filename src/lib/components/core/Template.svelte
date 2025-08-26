<script module lang="ts">
	import { beforeNavigate } from '$app/navigation';
	import { beforeRefresh, onRefresh, onScroll } from '$lib/hooks';
	import { createLayoutContext, useLayout } from '$lib/layout';
	import { createPreloadContext } from '$lib/preload';
	import { createScrollerContext } from '$lib/scroller';
	import { createAppContext, createInterfaceContext, useApp } from '$lib/states';
	import { createSuspenseContext } from '$lib/suspense';
	import { ScrollTrigger } from '$lib/gsap';

	export const setupTemplate = () => {
		const { scrollPaused, swapping } = createAppContext();
		const scroller = createScrollerContext({
			onUpdate(scroller) {
				onScroll.dispatch(scroller);
			}
		});
		createInterfaceContext();
		createLayoutContext();
		createPreloadContext();
		createPortalContext();
		createSuspenseContext({
			scope: 'app',
			final: true
		});

		$effect(() => {
			scroller.paused(scrollPaused());
		});

		onMount(() => {
			ScrollTrigger.addEventListener('refreshInit', beforeRefresh.dispatch);
			ScrollTrigger.addEventListener('refresh', onRefresh.dispatch);

			return () => {
				ScrollTrigger.removeEventListener('refreshInit', beforeRefresh.dispatch);
				ScrollTrigger.removeEventListener('refresh', onRefresh.dispatch);
			};
		});

		beforeNavigate(({ cancel }) => {
			if (swapping()) cancel();
		});
	};
</script>

<script lang="ts">
	import { RESIZE_DEBOUNCE } from '$lib/const';
	import { debounce, mergeCls } from '$lib/helpers';
	import { createPortalContext } from '$lib/portal';
	import { onResize } from '$lib/hooks';
	import favicon16 from '$lib/assets/favicon.png?width=16&string';
	import favicon32 from '$lib/assets/favicon.png?width=32&string';
	import favicon48 from '$lib/assets/favicon.png?width=48&string';
	import favicon180 from '$lib/assets/favicon.png?width=180&string';
	import { onMount, type Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { page } from '$app/state';
	import Page from './Page.svelte';

	const {
		children,
		fixed,
		adjacent,
		key = ((page.error && page.error.path) || page.route.id || '') + page.status,
		...props
	}: {
		/** The content of the current page to be rendered within the layout. */
		children: Snippet;
		/** Snippet used for fixed content, rendered outside the main scrolling area. */
		fixed?: Snippet;
		/** Snippet used for page-adjacent content, rendered inside the main scrolling area but outside the page content. */
		adjacent?: Snippet;
		/** A unique key to trigger page transitions. Defaults to the current route ID. */
		key?: unknown;
	} & HTMLAttributes<HTMLElement> = $props();

	const layout = useLayout();
	const { frozen } = useApp();
</script>

<svelte:head>
	<link rel="icon" type="image/png" sizes="16x16" href={favicon16} />
	<link rel="icon" type="image/png" sizes="32x32" href={favicon32} />
	<link rel="icon" type="image/png" sizes="48x48" href={favicon48} />
	<link rel="apple-touch-icon" sizes="180x180" href={favicon180} />
	<!-- #if DEV -->
	<script>
		if (matchMedia('(any-hover: none)').matches && !document.getElementById('eruda')) {
			import('https://esm.sh/eruda').then((eruda) => {
				eruda.default.init();
			});
		}
	</script>
	<!-- #endif -->
</svelte:head>

<svelte:window onresize={debounce(() => onResize.dispatch(), RESIZE_DEBOUNCE)} />

<div
	{...props}
	class={mergeCls(['w-full overflow-clip', { 'pointer-events-none': frozen() }], props.class)}
>
	<div id="smooth-wrapper">
		<div id="smooth-content">
			<main>
				{#key key}
					<Page>
						{@render children()}
					</Page>
				{/key}
			</main>
			{@render adjacent?.()}
		</div>
	</div>
	{@render fixed?.()}
	{#each layout.fixed as snippet}
		{@render snippet()}
	{/each}
</div>
