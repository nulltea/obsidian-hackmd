import {Plugin} from 'obsidian';

import {ObsidianHackMDSettingTab} from './ui';
import {delinkNote} from "./controllers/delinker";
import {ResultModal} from "./ui/resultModal";

interface ObsidianHackMDSettings {
	hackMdApiToken: string;
}

export interface PublishedNoteCache {
	name: string,
	publishedAt: number,
	publishURL: URL,
	contentHash: string
}

const DEFAULT_SETTINGS: ObsidianHackMDCache = {
	settings: {
		hackMdApiToken: ''
	},
	publishedNotes: new Map<string, PublishedNoteCache>()
}

interface ObsidianHackMDCache {
	settings: ObsidianHackMDSettings;
	publishedNotes: Map<string, PublishedNoteCache>;
}

export default class ObsidianHackMD extends Plugin {
	cache: ObsidianHackMDCache;

	async onload() {
		await this.loadCache();

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('paper-plane', 'Publish to HackMD', async (evt: MouseEvent) => {
			await this.loadCache();
			delinkNote(this, this.app.workspace.getActiveFile(), res => {
				this.saveCache()
				new ResultModal(this, res.publishURL).open();
			});
		});
		// Perform additional things with the ribbon

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status Bar Text');

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new ObsidianHackMDSettingTab(this.app, this));
	}

	async onunload() {
	}

	async loadCache() {
		this.cache = await this.loadData();
		try {
			this.cache.publishedNotes = new Map<string, PublishedNoteCache>(JSON.parse(await this.app.vault.adapter.read(".cachehackmd")));
		} catch (_) {
			this.cache.publishedNotes = new Map<string, PublishedNoteCache>();
		}
	}

	async saveCache() {
		await this.saveData(this.cache);
		await this.app.vault.adapter.write(".cachehackmd", JSON.stringify([...this.cache.publishedNotes]));
	}
}

