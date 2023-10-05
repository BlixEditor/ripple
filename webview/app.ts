import { writable } from 'svelte/store';
import App from './App.svelte';
import { WindowWithApis } from './types';

const media = writable({});

let sender = (message: string, data: any) => {};

const send = (message: string, data: any) => {
	sender(message, data);
}

const app = new App({
	target: document.body,
	props: { media },
});

window.addEventListener("DOMContentLoaded", () => {
    (window as WindowWithApis).api.on("mediaChanged", (newMedia) => {
		media.set(newMedia);
    });

	// To send a message back to main renderer
	sender = (message, data) => {
		(window as WindowWithApis).api.send(message, data);
	}
});

export { app };