<script lang="ts">
	import { browser } from '$app/environment';
	import type { HookCleaner } from '$lib/hooks';
	import {
		type SuspenseContextOptions,
		createSuspenseContext,
		type ComponentSuspense
	} from '$lib/suspense';
	import { onDestroy, type Snippet } from 'svelte';

	const {
		children,
		onreveal,
		onsuspend,
		ondestroy,
		...options
	}: {
		/** The content to be rendered, which can interact with the provided suspense context. */
		children: Snippet<[ComponentSuspense]>;
		/** A callback function that is executed when all suspense conditions are met and the content is revealed. */
		onreveal?: () => HookCleaner;
		/** A callback function that is executed when the component enters a suspended state. */
		onsuspend?: () => HookCleaner;
		/** A callback function that is executed when the component is destroyed. */
		ondestroy?: () => void;
	} & SuspenseContextOptions = $props();

	const suspense = createSuspenseContext(options);

	const { onReveal, onSuspend } = suspense;

	onReveal(() => {
		if (onreveal) onreveal();
	});

	onSuspend(() => {
		if (onsuspend) onsuspend();
	});

	onDestroy(() => {
		if (ondestroy) ondestroy();
	});
</script>

{@render children(suspense)}
