import { LINE_BREAK } from './constants';

export const escape = (value: string): string => {
	return value
		.replace(/\\/g, '\\\\')
		.replace(/\r?\n/g, '\\n')
		.replace(/,/g, '\\,')
		.replace(/;/g, '\\;');
};

export const joinLines = (lines: string[]): string => {
	return lines.join(LINE_BREAK) + LINE_BREAK;
};
