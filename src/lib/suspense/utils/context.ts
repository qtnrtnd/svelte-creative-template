import { getContext, setContext } from 'svelte';
import { SuspenseContext, type SuspenseContextOptions } from '../core/SuspenseContext.svelte';

export type SuspenseScope = 'app' | 'page' | 'parent';

export const suspenseContextKeys: Record<SuspenseScope, symbol> = {
	app: Symbol('app-suspense'),
	page: Symbol('page-suspense'),
	parent: Symbol('parent-suspense')
};

export const createSuspenseContext = (options?: SuspenseContextOptions) => {
	const context = setContext(suspenseContextKeys.parent, new SuspenseContext(options));

	if (context.options.scope && context.options.scope !== 'parent') {
		setContext(suspenseContextKeys[context.options.scope], context);
	}

	return SuspenseContext.extend(context);
};

export const useSuspense = (scope: SuspenseScope = 'parent') => {
	const context = getContext<SuspenseContext>(suspenseContextKeys[scope]);
	return (context ? SuspenseContext.extend(context) : undefined)!;
};
