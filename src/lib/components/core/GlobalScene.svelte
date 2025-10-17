<script lang="ts">
	import { T, useThrelte } from '@threlte/core';
	import { PERSPECTIVE } from '$lib/const';
	import type { Snippet } from 'svelte';
	import { gsap } from '$lib/gsap';

	const { children }: { children: Snippet } = $props();

	const { shouldRender, invalidate, size } = useThrelte();

	const fov = $derived(Math.atan($size.height / 2 / PERSPECTIVE) * (180 / Math.PI) * 2);

	gsap.ticker.add(() => {
		if (shouldRender()) {
			invalidate();
		}
	});
</script>

<T.PerspectiveCamera
	position.z={PERSPECTIVE}
	{fov}
	makeDefault
	oncreate={(ref) => {
		ref.lookAt(0, 0, 0);
	}}
/>

{@render children()}
