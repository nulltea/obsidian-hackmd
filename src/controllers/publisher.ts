import {request, TFile} from "obsidian";
import ObsidianHackMD, {PublishedNoteCache} from "../main";

const hashMD5 = require('md5');

const baseURL: string = "https://api.hackmd.io"

export type MarkdownNote = {
	content: string,
	file: TFile,
}
export type OnPublishCallback = (publ: PublishedNoteCache) => void;

export async function publishNote(plugin: ObsidianHackMD, note: MarkdownNote): Promise<PublishedNoteCache> {
	let resp = JSON.parse(await request({
		method: "POST",
		url: new URL('/v1/notes', baseURL).href,
		body: JSON.stringify({
			"title": note.file.name,
			"content": note.content,
			"readPermission": "guest",
			"writePermission": "owner",
			"commentPermission": "everyone"
		}),
		headers: {
			'Authorization': 'Bearer ' + plugin.cache.settings.hackMdApiToken,
			"Content-Type": "application/json"
		},
	}));

	if (resp.error !== undefined) {
		console.log(resp.error);
		return undefined;
	}

	let publ: PublishedNoteCache = {
		name: note.file.name,
		publishURL: new URL(`@${resp.userPath}/${resp.shortId}`, "https://hackmd.io"),
		publishedAt: resp.publishedAt,
		contentHash: hashMD5(note.content)
	}

	plugin.cache.publishedNotes.set(note.file.name, publ);

	return publ;
}

export async function readAndPublish(plugin: ObsidianHackMD, file: TFile): Promise<PublishedNoteCache> {
	return await publishNote(plugin, {file: file, content: await plugin.app.vault.read(file)});
}
