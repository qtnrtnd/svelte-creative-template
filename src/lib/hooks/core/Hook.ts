import { onDestroy, onMount } from 'svelte';

type HookListenerCallback<Parameters extends unknown[]> = (...params: Parameters) => HookCleaner;

type HookListenerOptions = {
	once?: boolean;
	priority?: -1 | 0 | 1;
};

type HookOptions<Parameters extends unknown[]> = {
	beforeDispatch?: () => void;
	afterDispatch?: () => void;
	defaults?: HookListenerOptions;
} & (Parameters extends [unknown, ...unknown[]]
	? object
	: { validate?: () => boolean; ssr?: boolean });

type HookListenerEntry<Parameters extends unknown[]> = {
	listener: HookListenerCallback<Parameters>;
	disabled: boolean;
	options: HookListenerOptions;
	cleanup?: HookCleaner | void;
};

export type HookCleaner = (() => void) | void;

export type HookFunction<Parameters extends unknown[] = []> = Hook<Parameters>['addListener'] &
	Omit<Public<Hook<Parameters>>, 'addListener'>;

export class Hook<Parameters extends unknown[] = []> {
	protected readonly _options: Readonly<HookOptions<[]>>;
	protected _entries: HookListenerEntry<Parameters>[] = [];

	constructor(options: HookOptions<Parameters> = {}) {
		this._options = Object.freeze(options);
	}

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

	removeListener(listener: HookListenerCallback<Parameters>): boolean {
		return this._destroy(listener);
	}

	get options(): Readonly<HookOptions<Parameters>> {
		return this._options;
	}

	protected _destroy(listener: HookListenerCallback<Parameters>) {
		const index = this._entries.findIndex((e) => e.listener === listener);

		if (index === -1) return false;

		const cleanup = this._entries[index].cleanup;

		if (cleanup) cleanup();

		this._entries.splice(index, 1);

		return true;
	}

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
