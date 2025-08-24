import { Hook } from '$lib/hooks/core/Hook';
import { SvelteMap, SvelteSet } from 'svelte/reactivity';
import { useSuspense, type SuspenseScope } from '../utils/context';
import { onDestroy, onMount } from 'svelte';
import { toArray, type Extracted } from '$lib/helpers';
import type { HookFunction } from '$lib/hooks';

type SuspenseTask = (() => Promise<unknown>) | Promise<unknown>;

export type SuspenseContextOptions = {
	final?: boolean;
	dependency?: SuspenseScope | Public<SuspenseContext> | null;
	scope?: SuspenseScope;
	suspendState?: Parameters<ComponentSuspense['suspendState']>[0];
	suspendTasks?: Parameters<ComponentSuspense['suspendTasks']>[0];
	suspendDelay?: Parameters<ComponentSuspense['suspendDelay']>[0];
};

export type ComponentSuspense = Public<SuspenseContext> & {
	suspendTasks: <T extends SuspenseTask | SuspenseTask[]>(
		tasks: T
	) => T extends unknown[] ? Extracted<T[number]>[] : Extracted<T>;
	suspendState: (state: () => boolean) => void;
	suspendDelay: (delay: number) => void;
};

export class SuspenseContext {
	private _pendingDelays = new SvelteMap<symbol, number>();
	private _pendingTasks = new SvelteSet<SuspenseTask>();
	private _pendingStates = new SvelteSet<() => boolean>();
	private _suspended = $state(true);
	private _totalTaskCount = $state(0);
	private _pendingTaskCount = $derived(this._pendingTasks.size);
	private _resolvedTaskCount = $derived(this._totalTaskCount - this._pendingTaskCount);
	private _progress = $derived(this._resolvedTaskCount / (this._totalTaskCount || 1));
	private _hasRevealed = false;
	private _timeoutId?: number;
	private _options: Readonly<SuspenseContextOptions>;
	onReveal: HookFunction;
	onSuspend: HookFunction;

	constructor(options: SuspenseContextOptions = {}) {
		this._options = Object.freeze({
			final: false,
			dependency: useSuspense(),
			scope: 'parent',
			...options
		});
		this.onReveal = Hook.create({
			validate: () => !this._suspended
		});
		this.onSuspend = Hook.create({
			validate: () => this._suspended
		});

		this._init();
	}

	static extend(context: SuspenseContext): ComponentSuspense {
		const componentId = Symbol();
		const componentTasks = new SvelteSet<SuspenseTask>();
		const componentStates = new SvelteSet<() => boolean>();

		onDestroy(() => {
			for (const task of componentTasks) {
				context._unsuspendTask(task, componentTasks);
			}

			for (const state of componentStates) {
				context._unsuspendState(state, componentStates);
			}

			context._pendingDelays.delete(componentId);
		});

		return {
			options: context.options,
			suspended: context.suspended,
			pendingTaskCount: context.pendingTaskCount,
			resolvedTaskCount: context.resolvedTaskCount,
			totalTaskCount: context.totalTaskCount,
			progress: context.progress,
			onReveal: context.onReveal,
			onSuspend: context.onSuspend,
			suspendTasks(tasks) {
				return context._suspendTasks(tasks, componentTasks);
			},
			suspendState(state) {
				return context._suspendState(state, componentStates);
			},
			suspendDelay(delay) {
				return context._pendingDelays.set(componentId, delay);
			}
		};
	}

	suspended = () => {
		return this._suspended;
	};

	pendingTaskCount = () => {
		return this._pendingTaskCount;
	};

	resolvedTaskCount = () => {
		return this._resolvedTaskCount;
	};

	totalTaskCount = () => {
		return this._totalTaskCount;
	};

	progress = () => {
		return this._progress;
	};

	get options() {
		return this._options;
	}

	private _getDelay() {
		return Math.max(0, ...this._pendingDelays.values()) * 1000;
	}

	private _init() {
		const { final, dependency, suspendDelay, suspendTasks, suspendState } = this._options;

		const parent = typeof dependency === 'string' ? useSuspense(dependency) : dependency;

		if (suspendDelay) {
			this._pendingDelays.set(Symbol(), suspendDelay);
		}

		if (suspendTasks) {
			this._suspendTasks(suspendTasks);
		}

		if (suspendState) {
			this._suspendState(suspendState);
		}

		$effect(() => {
			if (final && this._hasRevealed) return;

			const prev = this._suspended;
			const hasPendingState = Array.from(this._pendingStates).some((s) => s());
			const hasPendingTask = this._pendingTasks.size > 0;
			const currentSuspended = hasPendingState || hasPendingTask;
			const parentSuspended = parent ? parent.suspended() : false;
			const suspended = currentSuspended || parentSuspended;

			if (prev === suspended) return;

			clearTimeout(this._timeoutId);

			if (suspended) {
				this._suspended = true;
				this.onSuspend.dispatch();
			} else {
				this._timeoutId = setTimeout(() => {
					this._suspended = false;
					this._hasRevealed = true;
					this._pendingDelays.clear();
					this.onReveal.dispatch();
				}, this._getDelay());
			}
		});
	}

	private _wrapTask(task: SuspenseTask): Extracted<SuspenseTask> {
		return typeof task === 'function'
			? new Promise<unknown>((resolve, reject) => {
					onMount(() => {
						task()
							.then((value) => resolve(value))
							.catch((err) => reject(err));
					});
				})
			: task;
	}

	private _suspendTasks<
		Tasks extends SuspenseTask | SuspenseTask[],
		Return = Tasks extends unknown[] ? Extracted<Tasks[number]>[] : Extracted<Tasks>
	>(tasks: Tasks, componentTasks?: Set<SuspenseTask>): Return {
		const wrapped = Array.isArray(tasks)
			? tasks.map((t) => this._wrapTask(t))
			: this._wrapTask(tasks);

		if (!this._options.final || !this._hasRevealed) {
			if (!this._suspended) {
				this._totalTaskCount = 0;
			}

			for (const task of toArray(wrapped)) {
				if (componentTasks) componentTasks.add(task);

				this._pendingTasks.add(task);
				this._totalTaskCount++;

				task.finally(() => this._unsuspendTask(task, componentTasks));
			}
		}

		return wrapped as Return;
	}

	private _unsuspendTask(task: SuspenseTask, componentTasks?: Set<SuspenseTask>): void {
		if (componentTasks) componentTasks.delete(task);
		this._pendingTasks.delete(task);
	}

	private _suspendState(state: () => boolean, componentStates?: Set<() => boolean>): void {
		if (componentStates) componentStates.add(state);
		this._pendingStates.add(state);
	}

	private _unsuspendState(state: () => boolean, componentStates?: Set<() => boolean>): void {
		if (componentStates) componentStates.delete(state);
		this._pendingStates.delete(state);
	}
}
