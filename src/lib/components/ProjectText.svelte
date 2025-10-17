<script lang="ts">
	import type { Project } from '$lib/data/projects';
	import { chunkByLength } from '$lib/helpers';
	import { onMount } from 'svelte';
	import TextSeparator from './utils/SeparatorText.svelte';
	import TextWrap from './utils/WrapText.svelte';
	import starSrc from '$lib/assets/star.svg';

	console.log(starSrc);

	const { project, isEven }: { project: Project; isEven: boolean } = $props();
</script>

<div class={['flex flex-col gap-6', isEven && 'items-end md:-order-1']}>
	<div class={['flex w-full flex-col flex-wrap gap-y-2 font-medium', isEven && 'items-end']}>
		<!-- <h3 class={['flex flex-wrap gap-y-2', isEven && 'justify-end']}> -->
		<!-- <SplitSeparator text={project.title} position={isEven ? 'before' : 'after'} />
			  -->
		<!-- <Separator
			is="h3"
			class={['flex w-full flex-col gap-2', isEven && 'items-end']}
			items={project.title.split(' ')}
		/> -->
		<TextWrap is="h3" class="gap-y-2" text={project.title} align={isEven ? 'right' : 'left'} />
		<!-- </h3> -->
		<p>{project.year}</p>
	</div>
	<!-- <p class={['flex flex-wrap gap-y-2 w-full', isEven && 'justify-end']}> -->
	<!-- {#each chunkArray(project.tags, 2) as tags} -->
	<!-- <p> -->
	<!-- {@html project.tags
			.map((t, i) => `<span>${(i > 0 ? '<span>&nbsp;—&nbsp;</span>' : '') + t}</span>`)
			.join('')} -->
	<!-- <SplitSeparator text={project.tags} separator={'\u00a0—\u00a0'} position={isEven ? 'before' : 'after'} /> -->
	<TextSeparator
		is="p"
		class={['max-w-100 gap-2', isEven && 'text-right']}
		items={project.tags}
		separator="<span class='inline-flex mx-2'><img class='h-[0.65em]' src='{starSrc}'/></span>"
	/>

	<!-- </p> -->
	<!-- {/each} -->
	<!-- </p> -->
</div>
