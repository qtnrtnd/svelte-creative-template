export const latest = <T>(
	entries: [symbol, T][],
	id: symbol,
	value: T | undefined | null,
	fallback: T
): T => {
	if (value !== undefined) {
		const index = entries.findIndex(([s]) => s === id);

		if (value !== null) {
			if (index === -1) {
				entries.push([id, value]);
			} else {
				entries[index][1] = value;
			}
		} else if (index !== -1) {
			entries.splice(index, 1);
		}
	}

	return entries.length > 0 ? entries[entries.length - 1][1] : fallback;
};

export const some = (set: Set<symbol>, id: symbol, value: boolean | undefined): boolean => {
	if (value !== undefined) {
		if (value) set.add(id);
		else set.delete(id);
	}

	return set.size > 0;
};
