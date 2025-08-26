/**
 * A utility function to manage a state value that can be controlled by multiple
 * components, where the last component to set the value takes precedence.
 *
 * @template T - The type of the state value.
 * @param entries - An array of tuples, where each tuple contains a unique component
 *                  ID and its corresponding state value.
 * @param id - The unique ID of the component setting the state.
 * @param value - The new value to set. If `null`, the component's entry is removed.
 *                If `undefined`, the current state is returned without changes.
 * @param fallback - The default value to return if no component has set the state.
 * @returns The latest value set by any component, or the fallback value.
 */
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

/**
 * A utility function to manage a boolean state that is `true` if at least one
 * component has set its state to `true`.
 *
 * @param set - A `Set` containing the unique IDs of components that have set the
 *              state to `true`.
 * @param id - The unique ID of the component setting the state.
 * @param value - The boolean value to set for the component. If `undefined`, the
 *                current aggregate state is returned without changes.
 * @returns `true` if any component has set the state to `true`, `false` otherwise.
 */
export const some = (set: Set<symbol>, id: symbol, value: boolean | undefined): boolean => {
	if (value !== undefined) {
		if (value) set.add(id);
		else set.delete(id);
	}

	return set.size > 0;
};
