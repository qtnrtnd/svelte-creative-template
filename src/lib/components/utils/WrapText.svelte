<script lang="ts" generics="T extends keyof SvelteHTMLElements">
	import { mergeCls } from '$lib/helpers';
	import { type SvelteHTMLElements } from 'svelte/elements';

	const {
		text,
		align = 'left',
		is = 'span' as T,
		...rest
	}: {
		text: string;
		align?: 'center' | 'left' | 'right';
		is?: T;
	} & SvelteHTMLElements[T] = $props();

	const words = $derived(
		text.split(/\s+/).map((w, i, a) => {
			if (align === 'center') return '\u202f' + w + '\u202f';
			if (align === 'left' && i < a.length - 1) return w + '\u00a0';
			if (align === 'right' && i > 0) return '\u00a0' + w;
			return w;
		})
	);
</script>

<svelte:element
	this={is}
	{...rest}
	class={mergeCls(
		'flex flex-wrap',
		align === 'right' && 'justify-end',
		align === 'center' && 'justify-center',
		rest.class
	)}
>
	{#each words as word}
		<span>{word}</span>
	{/each}
</svelte:element>
