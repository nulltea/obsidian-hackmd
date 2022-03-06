import {App, LinkCache, Modal, Setting, TFile, ToggleComponent} from "obsidian";
import ObsidianHackMD from "../main";
const {clipboard} = require('electron');

export type LinkCacheExtended = LinkCache & { fromFile: TFile, toFile: TFile }
export type LinkedNotesSelectorCallback = (plugin: ObsidianHackMD, selected: Map<LinkCacheExtended, boolean>) => void;

export class ResultModal extends Modal {
	plugin: ObsidianHackMD;
	url: URL;

	constructor(plugin: ObsidianHackMD, url: URL) {
		super(plugin.app);
		this.plugin = plugin;
		this.url = url;
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.createEl('h3', {text: '🚀 YOUR NOTE IS NOW PUBLIC 🚀'});

		new Setting(contentEl)
			.setName('Here is your link:')
			.addText((tx) => tx.setValue(this.url.href))
			.addButton((b) => {
				b.setButtonText("COPY").onClick(evt =>
					clipboard.writeText(this.url.href))
			})
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}
