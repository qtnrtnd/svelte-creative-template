<script lang="ts">
	import '../app.css';
	import Header from '$lib/components/Header.svelte';
	import Template, { setupTemplate } from '$lib/components/core/Template.svelte';

	setupTemplate();

	const { children } = $props();
</script>

<Template>
	{#snippet fixed()}
		<!-- Fixed elements goes here -->
		<Header />
	{/snippet}

	{#snippet beforePage()}
		<!-- Content that should be placed right before page container goes here -->
	{/snippet}

	{#snippet page()}
		<!-- Page content goes here -->
		<div class="relative p-4 pt-12">
			{@render children()}
		</div>
	{/snippet}

	{#snippet afterPage()}
		<!-- Content that should be placed right after page container goes here -->
	{/snippet}
</Template>
