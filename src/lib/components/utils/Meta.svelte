<script lang="ts">
	import { page } from '$app/state';
	import { DOCUMENT_TITLE } from '$lib/const';

	const {
		title,
		documentTitle = DOCUMENT_TITLE,
		description,
		image,
		noindex,
		nofollow
	}: {
		/** The main title of the page, used for `og:title` and as input to `documentTitle`. */
		title: string;
		/** A function to format the document's `<title>` tag. Defaults to the `DOCUMENT_TITLE` constant. */
		documentTitle?: (title: string) => string;
		/** The page description, used for `description` and `og:description` meta tags. */
		description?: string;
		/** The URL of an image for social media previews (`og:image`, `twitter:image`). */
		image?: string;
		/** If `true`, adds `noindex` to the `robots` meta tag. */
		noindex?: boolean;
		/** If `true`, adds `nofollow` to the `robots` meta tag. */
		nofollow?: boolean;
	} = $props();

	const url = $derived(page.url.origin + page.url.pathname);

	const robots = $derived(
		[noindex ? 'noindex' : null, nofollow ? 'nofollow' : null].filter(Boolean).join(', ')
	);
</script>

<svelte:head>
	<title>{documentTitle(title)}</title>

	{#if robots}
		<meta name="robots" content={robots} />
	{/if}

	<meta name="description" content={description || ''} />
	<meta property="og:title" content={title} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content={url} />

	{#if description}
		<meta property="og:description" content={description} />
		<meta name="twitter:description" content={description} />
	{/if}

	{#if image}
		<meta property="og:image" content={image} />
		<meta name="twitter:image" content={image} />
		<meta name="twitter:card" content="summary_large_image" />
	{/if}

	<link rel="canonical" href={url} />
</svelte:head>
