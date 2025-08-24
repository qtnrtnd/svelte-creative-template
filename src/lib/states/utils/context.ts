import { getContext, setContext } from 'svelte';
import { AppContext } from '../core/AppContext.svelte';
import { InterfaceContext } from '../core/InterfaceContext.svelte';

const appContextKey = Symbol('app-context');

export const createAppContext = () => {
	const context = setContext(appContextKey, new AppContext());
	return AppContext.extend(context);
};

export const useApp = () => {
	const context = getContext<AppContext>(appContextKey);
	return (context ? AppContext.extend(context) : undefined)!;
};

const interfaceContextKey = Symbol('interface-context');

export const createInterfaceContext = () => {
	const context = setContext(interfaceContextKey, new InterfaceContext());
	return InterfaceContext.extend(context);
};

export const useInterface = () => {
	const context = getContext<InterfaceContext>(interfaceContextKey);
	return (context ? InterfaceContext.extend(context) : undefined)!;
};
