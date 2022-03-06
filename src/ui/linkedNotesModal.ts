import {App, LinkCache, Modal, Setting, TFile, ToggleComponent} from "obsidian";
import ObsidianHackMD from "../main";

export type LinkCacheExtended = LinkCache & { fromFile: TFile, toFile: TFile }
export type LinkedNotesSelectorCallback = (plugin: ObsidianHackMD, selected: Map<LinkCacheExtended, boolean>) => void;

export class LinkedNotesSelector extends Modal {
	plugin: ObsidianHackMD;
	links: LinkCacheExtended[];
	onSelect: LinkedNotesSelectorCallback;
	_toggleMap: Map<LinkCacheExtended, ToggleComponent>;

	constructor(plugin: ObsidianHackMD, links: LinkCacheExtended[], onSelect: LinkedNotesSelectorCallback) {
		super(plugin.app);
		this.plugin = plugin;
		this.links = links;
		this._toggleMap = new Map<LinkCacheExtended, ToggleComponent>();
		this.onSelect = onSelect;
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.createEl('h3', {text: 'Export linked notes?'});
		contentEl.createSpan({text: 'It looks like this note contains outgoing links. Select which of the linked notes to publish along with current'});

		this.links.forEach(link => {
			new Setting(contentEl)
				.setName(link.displayText)
				.setDesc(`${link.fromFile.path}:${link.position.end.line}:${link.position.end.col}: ${link.original}`)
				.addToggle(t => {
					t.setValue(true);
					this._toggleMap.set(link, t);
				})
		})

		new Setting(contentEl).addButton(b => {
			b.setIcon("enter").setButtonText("CONFIRM").onClick(evt => {
				let selected = new Map<LinkCacheExtended, boolean>();
				this._toggleMap.forEach((v, l, _) => {
					selected.set(l, v.getValue());
				})
				this.onSelect(this.plugin, selected);
				this.close();
			})
		})
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}
