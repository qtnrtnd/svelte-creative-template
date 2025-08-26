<script lang="ts">
	import Meta from '$lib/components/utils/Meta.svelte';

	const title = 'Home';
	const description = 'Welcome to your creative Svelte template.';
</script>

<Meta {title} {description} />

<h1 class="font-medium">{title}</h1>
<h2>{description}</h2>
