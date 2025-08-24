import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params: { path } }) => {
	error(404, { message: 'Not found', path });
};
