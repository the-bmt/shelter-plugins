(function(exports) {

"use strict";

//#region plugins/voice-bridge/index.js
const { flux: { dispatcher } } = shelter;
let ws = null;
let reconnectTimer = null;
function send(payload) {
	if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(payload));
}
function connect() {
	if (ws) return;
	try {
		ws = new WebSocket("ws://127.0.0.1:9001");
		ws.onopen = () => {
			console.log("[VoiceBridge] Connected to server on ws://127.0.0.1:9001");
		};
		ws.onclose = () => {
			ws = null;
			reconnectTimer = setTimeout(connect, 3e3);
		};
		ws.onerror = () => {
			if (ws) ws.close();
		};
	} catch (e) {
		ws = null;
		reconnectTimer = setTimeout(connect, 3e3);
	}
}
function handleDispatch(action) {
	if (!action || !action.type) return;
	const targetEvents = [
		"VOICE_STATE_UPDATES",
		"VOICE_CHANNEL_SELECT",
		"SPEAKING",
		"AUDIO_TOGGLE_SELF_MUTE",
		"AUDIO_TOGGLE_SELF_DEAF"
	];
	if (targetEvents.includes(action.type)) send({
		type: action.type,
		data: action
	});
}
function onLoad() {
	connect();
	dispatcher.subscribe(handleDispatch);
	console.log("[VoiceBridge] Loaded successfully");
}
function onUnload() {
	if (reconnectTimer) clearTimeout(reconnectTimer);
	if (ws) {
		ws.onclose = null;
		ws.close();
		ws = null;
	}
	dispatcher.unsubscribe(handleDispatch);
	console.log("[VoiceBridge] Unloaded");
}

//#endregion
exports.onLoad = onLoad
exports.onUnload = onUnload
return exports;
})({});