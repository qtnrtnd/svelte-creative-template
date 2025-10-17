<script lang="ts">
	import { toArray, mergeCls } from '$lib/helpers';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	const {
		// text,
		speed = 50,
		gap,
		children,
		separator,
		...props
	}: {
		/** The content to be displayed in the marquee. */
		children: Snippet;
		/** An optional snippet to render as a separator between repeated content. */
		separator?: Snippet;
		/** The speed of the marquee animation in pixels per second. */
		speed?: number;
		/** The gap between repeated content items. */
		gap?: string;
	} & HTMLAttributes<HTMLElement> = $props();

	let containerWidth = $state(0);
	let contentWidth = $state(0);

	const overflow = $derived(contentWidth > containerWidth);
	// const chunks = $derived(toArray(text));
</script>

<div {...props} class={mergeCls('overflow-hidden max-w-full', props.class)} bind:clientWidth={containerWidth}>
	<div
		class="flex w-max"
		style:animation-name={overflow ? 'translate-half-x-left' : null}
		style:animation-duration={contentWidth / speed + 's'}
		style:animation-iteration-count="infinite"
		style:animation-timing-function="linear"
		style:gap
	>
		<div class="flex shrink-0" style:gap bind:clientWidth={contentWidth}>
			{@render children()}
		</div>

		{#if overflow}
			{#if separator}
				{@render separator()}
			{/if}

			<div class="flex shrink-0" style:gap style:margin-right={gap}>
				{@render children()}
			</div>
		{/if}
	</div>
</div>
