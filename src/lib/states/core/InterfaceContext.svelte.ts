import { onDestroy } from 'svelte';

// Component-specific properties should be declared here.
type ComponentExtension = object;

export type ComponentApp = Public<InterfaceContext> & ComponentExtension;

export class InterfaceContext {
	private _swapOffset: number = $state(0);

	swapOffset(): number;
	swapOffset(value: number): void;
	swapOffset(value?: number): number | void {
		if (value === undefined) return this._swapOffset;
		this._swapOffset = value;
	}

	static extend(context: InterfaceContext): ComponentApp {
		// Component-specific implementation
		// Use the "latest" or "some" functions in ../utils/functions.ts
		// to handle a single state shared across multiple components
		const extended: ComponentApp = {
			swapOffset: context.swapOffset.bind(context)
		};

		onDestroy(() => {
			// Component cleanup
		});

		return extended;
	}
}
