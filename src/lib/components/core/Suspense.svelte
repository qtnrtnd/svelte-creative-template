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
		children: Snippet<[ComponentSuspense]>;
		onreveal?: () => HookCleaner;
		onsuspend?: () => HookCleaner;
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
