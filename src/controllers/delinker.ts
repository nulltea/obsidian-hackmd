import {App, TFile} from "obsidian";
import {LinkedNotesSelector} from "../ui";
import {publishNote, OnPublishCallback, readAndPublish} from "./publisher";
import ObsidianHackMD from "../main";
import {LinkCacheExtended} from "../ui/linkedNotesModal";

export async function delinkNote(plugin: ObsidianHackMD, note: TFile, callback: OnPublishCallback) {
	let linksOfNotes = discoverLinksRec(plugin.app, note);

	if (linksOfNotes.size == 0) {
		let md = await plugin.app.vault.read(note);
		return callback(await publishNote(plugin, {file: note, content: md}));
	}

	let linksSet = new Set<LinkCacheExtended>();

	linksOfNotes.forEach((v, k, _) => {
		if (v !== undefined) {
			linksSet = new Set([...linksSet, ...v]);
		}
	})

	new LinkedNotesSelector(plugin, [...linksSet], async (p, input) => {
		for (let [file, links] of linksOfNotes) {
			if (p.cache.publishedNotes.has(file.name) && file != note) {
				continue;
			}

			let md = await p.app.vault.read(file);
			if (links !== undefined) {
				for (let link of links) {
					let replacement = link.displayText

					if (link.toFile != null && input.get(link)) {
						let publ = p.cache.publishedNotes.has(link.toFile.name)
							? p.cache.publishedNotes.get(link.toFile.name)
							: await readAndPublish(p, link.toFile);
						replacement = `[${link.displayText}](${publ.publishURL.href})`;
					}

					md = md.replace(link.original, replacement);
				}
			}

			let publ = await publishNote(p, {file: file, content: md});

			if (file == note) {
				callback(publ);
			}
		}

	}).open();
}

function discoverLinksRec(app: App, note: TFile): Map<TFile, LinkCacheExtended[]> {
	if (note == null) {
		return null;
	}

	let links = app.metadataCache.getFileCache(note).links;
	let res = new Map<TFile, LinkCacheExtended[]>();
	let extLinks = new Set<LinkCacheExtended>();

	if (links !== undefined) {
		for (let link of links) {
			let linkedNote = app.metadataCache.getFirstLinkpathDest(link.link, note.path);
			if (linkedNote === undefined) {
				throw new Error(`failed finding note for ${link.original} link`);
			}
			let inner = discoverLinksRec(app, linkedNote);
			if (inner != null) {
				res = new Map([...res, ...inner])
			}
			extLinks.add({
				link: link.link,
				displayText: link.displayText,
				original: link.original,
				position: link.position,
				fromFile: note,
				toFile: linkedNote,
			})
		}
	}

	res.set(note, [...extLinks]);

	return res;
}
