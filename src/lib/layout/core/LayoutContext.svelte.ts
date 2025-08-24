import { type Snippet } from 'svelte';
import { SvelteSet } from 'svelte/reactivity';

export class LayoutContext {
	private _fixed = new SvelteSet<Snippet>();

	get fixed() {
		return this._fixed;
	}
}
