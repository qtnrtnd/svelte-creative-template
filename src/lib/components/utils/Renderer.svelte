<script lang="ts">
	import { useLayout } from '$lib/layout';
	import type { Snippet } from 'svelte';
	import Portal from '../core/Portal.svelte';
	import type { PortalContext } from '$lib/portal';
	import { useThrelte, type ThrelteContext } from '@threlte/core';
	import { WebGPURenderer, type Renderer } from 'three/webgpu';

	const {
		children: _children
	}: {
		/** The content to be rendered within the canvas renderer. */
		children: Snippet<[Public<PortalContext> & ThrelteContext<WebGPURenderer>]>;
	} = $props();

	const layout = useLayout();

	const mountHandler = (snippet: Snippet) => {
		layout.renderer.add(snippet);
	};

	const unmountHandler = (snippet: Snippet) => {
		layout.renderer.delete(snippet);
	};
</script>

<Portal onmount={mountHandler} onunmount={unmountHandler}>
	{#snippet children(portal)}
		{@render _children({ ...portal, ...useThrelte() })}
	{/snippet}
</Portal>
