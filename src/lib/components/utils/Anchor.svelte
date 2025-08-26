<script lang="ts">
	import { page } from '$app/state';
	import { mergeFns } from '$lib/helpers';
	import { useApp } from '$lib/states';
	import type { Snippet } from 'svelte';
	import type { HTMLAnchorAttributes } from 'svelte/elements';

	let {
		children,
		node = $bindable(),
		...props
	}: {
		/** The content of the anchor tag. */
		children: Snippet;
		/** A bindable reference to the underlying `<a>` element. */
		node?: HTMLAnchorElement;
	} & HTMLAnchorAttributes = $props();

	const { frozen } = useApp();

	const href = $derived(props.href ?? '#');
	const url = $derived(new URL(href, page.url.origin));
	const external = $derived(page.url.origin !== url.origin);
	const samePage = $derived(!external && page.url.pathname === url.pathname);

	const clickHandler: HTMLAnchorAttributes['onclick'] = (e) => {
		if (samePage || (frozen() && !external)) {
			e.preventDefault();

			if (samePage) {
				scrollTo({
					behavior: 'smooth',
					top: 0
				});
			}
		}
	};
</script>

<a
	bind:this={node}
	{...props}
	{href}
	target={props.target ?? (external ? '_blank' : null)}
	role={props.role ?? 'button'}
	tabindex={props.tabindex ?? 0}
	onclick={mergeFns(clickHandler, props.onclick)}
>
	{@render children()}
</a>
