<script lang="ts">
	import '../app.css';
	import Header from '$lib/components/Header.svelte';
	import Template, { setupTemplate } from '$lib/components/core/Template.svelte';
	import EffectComposer from '$lib/components/utils/EffectComposer.svelte';

	setupTemplate();

	const { children } = $props();
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
	<link
		href="https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<Template class="font-outfit text-[2rem] leading-none font-medium uppercase">
	{#snippet fixed()}
		<!-- Snippet used for fixed content, rendered outside the main scrolling area -->
	{/snippet}

	<div class="px-6 py-5">
		<!-- The content of the current page to be rendered within the layout -->
		{@render children()}
	</div>

	{#snippet renderer()}
		<!-- Snippet to be rendered within the WebGPU renderer -->
		<EffectComposer />
	{/snippet}

	{#snippet adjacent()}
		<!-- Snippet used for page-adjacent content, rendered inside the main scrolling area but outside the page content -->
	{/snippet}
</Template>
