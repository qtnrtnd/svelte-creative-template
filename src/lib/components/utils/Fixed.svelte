<script lang="ts">
	import { useLayout } from '$lib/layout';
	import type { Snippet } from 'svelte';
	import Portal from '../core/Portal.svelte';
	import type { PortalContext } from '$lib/portal';

	const { children: _children }: {
		/** The content to be rendered in a fixed position. */
		children: Snippet<[PortalContext]>;
	} = $props();

	const layout = useLayout();

	const mountHandler = (snippet: Snippet) => {
		layout.fixed.add(snippet);
	};

	const unmountHandler = (snippet: Snippet) => {
		layout.fixed.delete(snippet);
	};
</script>

<Portal onmount={mountHandler} onunmount={unmountHandler}>
	{#snippet children(portal)}
		{@render _children(portal)}
	{/snippet}
</Portal>
