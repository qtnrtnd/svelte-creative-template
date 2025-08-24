<script module lang="ts">
	import { beforeNavigate } from '$app/navigation';
	import { onScroll } from '$lib/hooks';
	import { createLayoutContext, useLayout } from '$lib/layout';
	import { createPreloadContext } from '$lib/preload';
	import { createScrollerContext } from '$lib/scroller';
	import { createAppContext, createInterfaceContext, useApp } from '$lib/states';
	import { createSuspenseContext } from '$lib/suspense';

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
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { page } from '$app/state';
	import Page from './Page.svelte';

	const {
		page: _page,
		fixed,
		beforePage,
		afterPage,
		key = ((page.error && page.error.path) || page.route.id || '') + page.status,
		...props
	}: {
		page: Snippet;
		fixed?: Snippet;
		beforePage?: Snippet;
		afterPage?: Snippet;
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
	<main>
		<div id="smooth-wrapper">
			<div id="smooth-content">
				{@render beforePage?.()}
				{#key key}
					<Page>
						{@render _page()}
					</Page>
				{/key}
				{@render afterPage?.()}
			</div>
		</div>
	</main>
	{@render fixed?.()}
	{#each layout.fixed as snippet}
		{@render snippet()}
	{/each}
</div>
