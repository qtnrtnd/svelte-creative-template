import { onDestroy, onMount } from 'svelte';

/**
 * A callback function executed by a `Hook` when it is dispatched.
 * It can optionally return a `HookCleaner` function for cleanup.
 *
 * @template Parameters - The types of the arguments passed to the callback.
 */
type HookListenerCallback<Parameters extends unknown[]> = (...params: Parameters) => HookCleaner;

/**
 * Configuration options for a `Hook` listener.
 */
type HookListenerOptions = {
	/** If `true`, the listener will be removed after its first execution. */
	once?: boolean;
	/** The priority of the listener, determining its execution order.
	 * `1`: High priority (executes first).
	 * `0`: Normal priority (default).
	 * `-1`: Low priority (executes last).
	 */
	priority?: -1 | 0 | 1;
};

/**
 * Configuration options for creating a `Hook`.
 */
type HookOptions<Parameters extends unknown[]> = {
	/** A function to run before the hook dispatches to its listeners. */
	beforeDispatch?: () => void;
	/** A function to run after the hook has dispatched to all its listeners. */
	afterDispatch?: () => void;
	/** Default options to apply to all listeners added to this hook. */
	defaults?: HookListenerOptions;
} & (Parameters extends [unknown, ...unknown[]]
	? object
	: {
			/** A validation function that, if it returns `true`, will cause the hook to run on mount. */
			validate?: () => boolean;
			/** If `true`, allows the hook to run during Server-Side Rendering (SSR). */
			ssr?: boolean;
	  });

/**
 * An internal representation of a listener entry within a `Hook`.
 * @internal
 */
type HookListenerEntry<Parameters extends unknown[]> = {
	listener: HookListenerCallback<Parameters>;
	disabled: boolean;
	options: HookListenerOptions;
	cleanup?: HookCleaner | void;
};

/**
 * A function that can be returned by a `HookListenerCallback` to perform cleanup
 * when the listener is re-run or destroyed.
 */
export type HookCleaner = (() => void) | void;

/**
 * The public interface of a `Hook`, exposed as a function that can be used to add listeners.
 * It also includes methods for dispatching events and removing listeners.
 */
export type HookFunction<Parameters extends unknown[] = []> = Hook<Parameters>['addListener'] &
	Omit<Public<Hook<Parameters>>, 'addListener'>;

/**
 * A class that implements the observer pattern, allowing for the creation of event channels
 * where listeners can subscribe to dispatched events. It supports features like listener
 * priority, one-time listeners, and automatic cleanup.
 *
 * @template Parameters - The types of the arguments passed to listeners when the hook is dispatched.
 */
export class Hook<Parameters extends unknown[] = []> {
	protected readonly _options: Readonly<HookOptions<[]>>;
	protected _entries: HookListenerEntry<Parameters>[] = [];

	/**
	 * Initializes a new `Hook` instance.
	 * @param options - Configuration options for the hook.
	 */
	constructor(options: HookOptions<Parameters> = {}) {
		this._options = Object.freeze(options);
	}

	/**
	 * A static factory method to create a new `Hook` and return its public-facing function interface.
	 *
	 * @param options - Configuration options for the hook.
	 * @returns A `HookFunction` that can be used to interact with the hook.
	 */
	static create<Parameters extends unknown[] = []>(
		options: HookOptions<Parameters> = {}
	): HookFunction<Parameters> {
		const hook = new this<Parameters>(options);

		return Object.assign<
			Hook<Parameters>['addListener'],
			Omit<Public<Hook<Parameters>>, 'addListener'>
		>(
			(listener, options) => {
				hook.addListener(listener, options);
			},
			{
				options: hook.options,
				dispatch: hook.dispatch.bind(hook),
				removeListener: hook.removeListener.bind(hook)
			}
		);
	}

	/**
	 * Adds a listener to the hook.
	 *
	 * @param listener - The callback function to be executed when the hook is dispatched.
	 * @param options - Optional configuration for this specific listener.
	 */
	addListener(listener: HookListenerCallback<Parameters>, options?: HookListenerOptions): void {
		if (this._entries.find((e) => e.listener === listener)) {
			return;
		}

		const entry: HookListenerEntry<Parameters> = {
			listener,
			disabled: false,
			options: {
				once: false,
				priority: 0,
				...this._options.defaults,
				...options
			}
		};

		if (entry.options.priority === 1) {
			this._entries.unshift(entry);
		} else {
			this._entries.push(entry);
		}

		if (this._options.validate && this._options.validate()) {
			if (this._options.ssr) {
				this._run(entry, ...([undefined] as Parameters));
			} else {
				onMount(() => {
					this._run(entry, ...([undefined] as Parameters));
				});
			}
		}

		onDestroy(() => {
			this._destroy(listener);
		});
	}

	/**
	 * Dispatches an event to all registered listeners, passing the provided parameters.
	 *
	 * @param params - The arguments to pass to each listener.
	 */
	dispatch(...params: Parameters): void {
		if (this._options.beforeDispatch) {
			this._options.beforeDispatch();
		}

		const deferredEntries: HookListenerEntry<Parameters>[] = [];

		for (const entry of this._entries) {
			if (entry.options.priority === -1) {
				deferredEntries.push(entry);
				continue;
			}

			this._run(entry, ...params);
		}

		for (const entry of deferredEntries) {
			this._run(entry, ...params);
		}

		if (this._options.afterDispatch) {
			this._options.afterDispatch();
		}
	}

	/**
	 * Removes a specific listener from the hook.
	 *
	 * @param listener - The listener function to remove.
	 * @returns `true` if the listener was found and removed, `false` otherwise.
	 */
	removeListener(listener: HookListenerCallback<Parameters>): boolean {
		return this._destroy(listener);
	}

	/**
	 * The configuration options for the hook.
	 */
	get options(): Readonly<HookOptions<Parameters>> {
		return this._options;
	}

	/**
	 * Internal method to remove a listener and perform cleanup.
	 * @internal
	 */
	protected _destroy(listener: HookListenerCallback<Parameters>) {
		const index = this._entries.findIndex((e) => e.listener === listener);

		if (index === -1) return false;

		const cleanup = this._entries[index].cleanup;

		if (cleanup) cleanup();

		this._entries.splice(index, 1);

		return true;
	}

	/**
	 * Internal method to execute a listener.
	 * @internal
	 */
	protected _run(entry: HookListenerEntry<Parameters>, ...params: Parameters) {
		if (entry.disabled) {
			return;
		}

		try {
			if (entry.cleanup) entry.cleanup();
			entry.cleanup = entry.listener(...params);
		} catch (error) {
			console.error('Error executing hook listener:', error);
		}

		if (entry.options.once) {
			entry.disabled = true;
		}
	}
}
