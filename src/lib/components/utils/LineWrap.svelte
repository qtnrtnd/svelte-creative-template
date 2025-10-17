<!-- <h2 class="flex flex-wrap gap-y-2"><span>Creative&nbsp;</span><span>developer</span></h2>

<script lang="ts">
	import type { HTMLAttributes } from "svelte/elements";

    const _props = $props();
    const { as = HTMLDivElement, text, ...rest }: { as?: typeof HTMLElement, text: string } & HTMLAttributes<typeof _props['as']> = _props;

    const instance = $derived();
    const words = $derived(text.split(/\s+/));

    const 
</script>

<svelte:element bind:this={() => instance, (_) => {}} this={instance.tagName} {...rest}>
    {@html words.map((word, i) => `<span>${word + (i < words.length - 1 ? '&nbsp;' : '')}</span>`).join('')}
</svelte:element> -->
