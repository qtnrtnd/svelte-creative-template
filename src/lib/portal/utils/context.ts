import { getContext, setContext } from 'svelte';
import { PortalContext } from '../core/PortalContext.svelte';

const contextKey = Symbol('portal-context');

export const createPortalContext = () => {
	return setContext(contextKey, new PortalContext());
};

export const usePortal = () => {
	return getContext<PortalContext>(contextKey);
};
