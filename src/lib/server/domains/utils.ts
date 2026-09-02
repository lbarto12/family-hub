export class ValueNotFound extends Error {
	public constructor() {
		super('a requested resource could not be found');
		// Explicitly set the prototype to fix 'instanceof' in some environments
		Object.setPrototypeOf(this, ValueNotFound.prototype);
		this.name = 'ValueNotFound';
	}
}

export const getFirst = <T extends unknown[]>(values: T): T[number] => {
	if (values.length === 0) throw new ValueNotFound();
	return values[0];
};

/**
 * getFirst for callers where an empty result is an ordinary answer rather than
 * a failure
 */
export const getFirstOrUndefined = <T extends unknown[]>(values: T): T[number] | undefined =>
	values.at(0);
