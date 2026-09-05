export interface Toast {
	type: 'toast' | 'error';
	message: string;
}

export const localtoasts: Toast[] = $state([]);

export const toast = (toast: Toast) => {
	localtoasts.unshift(toast);
	setTimeout(() => {
		localtoasts.pop();
	}, 3000);
};
