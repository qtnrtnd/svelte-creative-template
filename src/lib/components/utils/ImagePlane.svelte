<script lang="ts">
	import { onMount } from 'svelte';
	import Renderer from './Renderer.svelte';
	import type { HTMLImgAttributes } from 'svelte/elements';
	import Plane from './Plane.svelte';
	import { on } from 'svelte/events';
	import { mergeCls } from '$lib/helpers';
	import { Fn, uv } from 'three/tsl';
	import { fitCover, type PlaneProps } from '$lib/renderer';
	import { ScrollTrigger } from '$lib/gsap';
	import { Mesh } from 'three';

	let {
		node = $bindable(),
		mesh = $bindable(),
		bleed,
		shader,
		...props
	}: HTMLImgAttributes &
		PlaneProps & {
			node?: HTMLImageElement;
			mesh?: Mesh;
		} = $props();

	let src = $state<string>();

	onMount(() => {
		if (!node) return;

		const offLoad = on(node, 'load', () => {
			src = node!.currentSrc;
		});

		return () => {
			offLoad();
		};
	});

	let useRenderer = $state(true);
</script>

<img bind:this={node} {...props} class={mergeCls(props.class, { 'opacity-0': useRenderer })} />

{#if useRenderer}
	<Renderer>
		<Plane bind:mesh {node} {src} {bleed} {shader} />
	</Renderer>
{/if}
