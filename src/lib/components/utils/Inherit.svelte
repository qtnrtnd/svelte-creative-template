<script lang="ts">
	import { setContext, type Snippet } from 'svelte';

	const {
		children,
		contexts
	}: {
		/** The content that will inherit the contexts. */
		children: Snippet;
		/** A map of contexts to be set for the children. */
		contexts: Map<unknown, unknown>;
	} = $props();

	for (const [key, context] of contexts) {
		setContext(key, context);
	}
</script>

{@render children()}
