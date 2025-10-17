<script lang="ts">
	import { mergeCls } from '$lib/helpers';
	import type { HTMLAttributes, SVGAttributes } from 'svelte/elements';

	const { text, ...rest }: { text: string } & SVGAttributes<SVGSVGElement> = $props();

	let textEl: SVGTextElement;
	let width = $state(0);
	let height = $state(0);
	let x = $state(0);
	let y = $state(0);
	let clientWidth = $state(0);

	$effect(() => {
		const rect = textEl.getBBox();
		width = rect.width;
		height = rect.height;
		x = -rect.x;
		y = -rect.y;
		clientWidth;
	});
</script>

<svg
	viewBox="0 0 {width} 1em"
	{width}
	class={mergeCls('inline-block h-[1em] overflow-visible align-baseline', rest.class)}
	{...rest}
>
	<text bind:this={textEl} bind:clientWidth {x} {y}>
		{text}
	</text>
</svg>
