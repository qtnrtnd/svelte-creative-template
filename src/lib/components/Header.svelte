<script lang="ts">
	import Anchor from './utils/Anchor.svelte';
</script>

<header class="fixed top-0 left-0 flex h-12 w-full items-center justify-end px-4 bg-indigo-500 text-white">
	<nav>
		<ul class="flex gap-4">
			<li>
				<Anchor href="/">Home</Anchor>
			</li>
			<li>
				<Anchor href="/about">About</Anchor>
			</li>
            <li>
				<Anchor href="/404">404 Test</Anchor>
			</li>
		</ul>
	</nav>
</header>
