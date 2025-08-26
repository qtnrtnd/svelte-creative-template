<script lang="ts">
	import { page } from '$app/state';
	import Meta from '$lib/components/utils/Meta.svelte';

	const title = $derived('Error ' + page.status);
</script>

<Meta {title} noindex />

<h1 class="font-medium">{title}</h1>
<h2>{page.error!.message}</h2>
