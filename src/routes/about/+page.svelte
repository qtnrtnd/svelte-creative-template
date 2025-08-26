<script lang="ts">
	import Meta from '$lib/components/utils/Meta.svelte';

	const title = 'About';
	const description =
		'This is a creative Svelte template designed to make building complex frontends simple, fast, and enjoyable.';
</script>

<Meta {title} {description} />

<h1 class="font-medium">{title}</h1>
<h2>{description}</h2>
