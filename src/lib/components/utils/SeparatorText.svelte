<script lang="ts" generics="T extends keyof SvelteHTMLElements">
	import { mergeCls } from '$lib/helpers';
	import type { SvelteHTMLElements } from 'svelte/elements';

	const {
		items,
		separator = '&nbsp;',
		is = 'span' as T,
		...rest
	}: {
		items: string[];
		separator?: string;
		is?: T;
	} & SvelteHTMLElements[T] = $props();

	let container: HTMLElement;
	let currentLine: HTMLElement;
	let offsetWidth = $state(0);

	const extendLine = (value: string, force = false): { el: HTMLElement; success: boolean } => {
		const el = document.createElement('span');

		el.innerHTML = value;
		el.classList.add('whitespace-nowrap');
		currentLine.appendChild(el);

		if (!force && currentLine.scrollWidth > offsetWidth) {
			currentLine.removeChild(el);
			return { el, success: false };
		}

		return { el, success: true };
	};

	const newLine = () => {
		currentLine = document.createElement('span');
		currentLine.classList.add('whitespace-nowrap');
		container.appendChild(currentLine);
	};

	const appendItem = (value: string, isLineStart: boolean) => {
		let separatorOp: { el: HTMLElement; success: boolean } | null = null;

		if (!isLineStart) {
			separatorOp = extendLine(separator);
		}

		if (!separatorOp || separatorOp.success) {
			const itemOp = extendLine(value, isLineStart);

			if (!itemOp.success) {
				if (separatorOp) {
					currentLine.removeChild(separatorOp.el);
				}

				newLine();
				extendLine(value, true);
			}
		} else {
			newLine();
			extendLine(value, true);
		}
	};

	$effect(() => {
		container.innerHTML = '';
		newLine();

		for (let i = 0; i < items.length; i++) {
			appendItem(items[i], i === 0);
		}
	});
</script>

<svelte:element
	this={is}
	{...rest}
	bind:this={container}
	bind:offsetWidth
	class={mergeCls('w-full flex flex-col', rest.class)}
>
	{#each items as item}
		<span class="whitespace-nowrap">{item}</span>
	{/each}
</svelte:element>
