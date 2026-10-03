(function(exports) {

"use strict";

//#region plugins/voice-bridge/index.js
let ws = null;
let reconnectTimer = null;
let unsubDispatcher = null;
function send(type, data) {
	if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({
		type,
		data
	}));
}
function connect() {
	if (ws) return;
	console.log("[VoiceBridge] Attempting connection to Rust server...");
	try {
		ws = new WebSocket("ws://127.0.0.1:9001");
		ws.onopen = () => {
			console.log("[VoiceBridge] Connected successfully!");
		};
		ws.onclose = (e) => {
			console.log("[VoiceBridge] Connection closed. Reconnecting in 3s...", e.reason);
			ws = null;
			reconnectTimer = setTimeout(connect, 3e3);
		};
		ws.onerror = (err) => {
			console.error("[VoiceBridge] WebSocket error encountered:", err);
			if (ws) ws.close();
		};
	} catch (err) {
		console.error("[VoiceBridge] Exception during connect:", err);
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
	if (targetEvents.includes(action.type)) send(action.type, action);
}
function onLoad() {
	connect();
	if (typeof shelter !== "undefined" && shelter?.flux?.dispatcher) unsubDispatcher = shelter.flux.dispatcher.subscribe(handleDispatch);
	console.log("[VoiceBridge] Plugin loaded.");
}
function onUnload() {
	if (reconnectTimer) clearTimeout(reconnectTimer);
	if (unsubDispatcher) unsubDispatcher();
	if (ws) {
		ws.onclose = null;
		ws.close();
		ws = null;
	}
	console.log("[VoiceBridge] Plugin unloaded.");
}

//#endregion
exports.onLoad = onLoad
exports.onUnload = onUnload
return exports;
})({});