<script lang="ts">
	import { getAllContexts, onDestroy, onMount, type Snippet } from 'svelte';
	import Inherit from '../utils/Inherit.svelte';
	import { createPortalContext, PortalContext } from '$lib/portal';

	const {
		children,
		onmount,
		onunmount
	}: {
		/** The content to be rendered within the portal. */
		children: Snippet<[PortalContext]>;
		/** A callback function that is executed when the portal's content is mounted. */
		onmount?: (snippet: Snippet) => void;
		/** A callback function that is executed when the portal's content is unmounted. */
		onunmount?: (snippet: Snippet) => void;
	} = $props();

	const portal = createPortalContext();

	const { keepAlive } = portal;

	let unmounted = false;

	const outroStartHandler = () => {
		if (onunmount) onunmount(snippet);
		unmounted = true;
	};

	onMount(() => {
		if (onmount) onmount(snippet);
		return () => {
			if (!unmounted && onunmount) onunmount(snippet);
		};
	});
</script>

<div class="hidden" data-portal="outer" out:keepAlive|global onoutrostart={outroStartHandler}></div>

{#snippet snippet()}
	<div class="hidden" data-portal="inner" out:keepAlive|global></div>

	<Inherit contexts={getAllContexts()}>
		{@render children(portal)}
	</Inherit>
{/snippet}
