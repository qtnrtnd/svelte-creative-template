<script lang="ts">
	import { setContext, type Snippet } from 'svelte';

	const { children, contexts }: { children: Snippet; contexts: Map<unknown, unknown> } = $props();

	for (const [key, context] of contexts) {
		setContext(key, context);
	}
</script>

{@render children()}
