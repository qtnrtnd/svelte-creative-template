<script lang="ts">
	import { getAllContexts, onDestroy, onMount, type Snippet } from 'svelte';
	import Inherit from '../utils/Inherit.svelte';
	import { createPortalContext, PortalContext } from '$lib/portal';

	const {
		children,
		onmount,
		onunmount
	}: {
		children: Snippet<[PortalContext]>;
		onmount?: (snippet: Snippet) => void;
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
		if (onmount) {
			onmount(snippet);
		}
	});

	onDestroy(() => {
		if (!unmounted && onunmount) {
			onunmount(snippet);
		}
	});
</script>

<div class="hidden" data-portal="outer" out:keepAlive|global onoutrostart={outroStartHandler}></div>

{#snippet snippet()}
	<div class="hidden" data-portal="inner" out:keepAlive|global></div>

	<Inherit contexts={getAllContexts()}>
		{@render children(portal)}
	</Inherit>
{/snippet}
