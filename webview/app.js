import { writable } from 'svelte/store';
import App from './App.svelte';

const media = writable({});

let sender = (message, data) => {};

const send = (message, data) => {
	sender(message, data);
}

const app = new App({
	target: document.body,
	props: { media },
});

window.addEventListener("DOMContentLoaded", () => {
    window.api.on("mediaChanged", (newMedia) => {
		if (newMedia.assets && newMedia.content) {
			media.set(newMedia);
		}
    });

	// To send a message back to main renderer
	sender = (message, data) => {
		window.api.send(message, data);
	}
});

export { app };