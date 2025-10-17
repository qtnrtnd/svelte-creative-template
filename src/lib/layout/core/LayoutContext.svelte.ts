import { type Snippet } from 'svelte';
import { SvelteSet } from 'svelte/reactivity';

/**
 * A class that manages the context for layout-related snippets.
 * It provides a centralized way to collect and render snippets from various
 * components into designated areas of the application layout.
 */
export class LayoutContext {
	/**
	 * A reactive set containing snippets intended for a 'fixed' layout area.
	 * @private
	 */
	private _fixed = new SvelteSet<Snippet>();
	private _renderer = new SvelteSet<Snippet>();

	/**
	 * Provides read-only access to the reactive set of 'fixed' snippets.
	 * Components can use this to render these snippets in the appropriate layout location.
	 */
	get fixed() {
		return this._fixed;
	}

	get renderer() {
		return this._renderer;
	}
}
