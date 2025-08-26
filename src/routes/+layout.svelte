<script lang="ts">
	import '../app.css';
	import Header from '$lib/components/Header.svelte';
	import Template, { setupTemplate } from '$lib/components/core/Template.svelte';

	setupTemplate();

	const { children } = $props();
</script>

<Template>
	{#snippet fixed()}
        <!-- Snippet used for fixed content, rendered outside the main scrolling area -->
		<Header />
	{/snippet}

    <!-- The content of the current page to be rendered within the layout -->
	<div class="relative p-4 pt-16">
		{@render children()}
	</div>

	{#snippet adjacent()}
        <!-- Snippet used for page-adjacent content, rendered inside the main scrolling area but outside the page content -->
	{/snippet}
</Template>
