import {
	App,
	Editor,
	MarkdownView,
	Modal,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
	LinkCache,
	request,
	ToggleComponent, TFile
} from 'obsidian';

// Remember to rename these classes and interfaces!

interface ObsidianHackMDSettings {
	hackMdApiToken: string;
}

const DEFAULT_SETTINGS: ObsidianHackMDSettings = {
	hackMdApiToken: ''
}

const baseURL: string = "https://api.hackmd.io"

export default class ObsidianHackMD extends Plugin {
	settings: ObsidianHackMDSettings;

	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('paper-plane', 'Publish to HackMD', async (evt: MouseEvent) => {
			let resp = JSON.parse(await request({
				method: "POST",
				url: new URL('/v1/notes', baseURL).href,
				body: JSON.stringify({
					"title": this.app.workspace.getActiveFile().name,
					"content": await this.app.vault.read(this.app.workspace.getActiveFile()),
					"readPermission": "owner",
					"writePermission": "owner",
					"commentPermission": "everyone"
				}),
				headers: {
					'Authorization': 'Bearer ' + this.settings.hackMdApiToken,
					"Content-Type": "application/json"
				},
			}));

			console.log(resp)

			if (resp.error !== undefined) {
				return false;
			} else {
				new Notice("Published!", 3600)
			}
		});
		// Perform additional things with the ribbon

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status Bar Text');

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new ObsidianHackMDSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

type LinkedNotesSelectorCallback = (selected: Map<TFile, boolean>) => void;

class LinkedNotesSelector extends Modal {
	links: LinkCache[];
	onSelect: LinkedNotesSelectorCallback;
	_toggleMap: Map<TFile, ToggleComponent>;

	constructor(app: App, links: LinkCache[], onSelect: LinkedNotesSelectorCallback) {
		super(app);
		this.links = links;
		this._toggleMap = new Map<TFile, ToggleComponent>();
		this.onSelect = onSelect;
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.createEl('h3', {text: 'Export linked notes?'});
		contentEl.createSpan({text: 'It looks like this note contains outgoing links. Select which of the linked notes to publish along with current'});

		this.links.forEach(link => {
			let file = this.app.metadataCache.getFirstLinkpathDest(link.link, this.app.workspace.getActiveFile().path);
			new Setting(contentEl)
				.setName(link.displayText)
				.setDesc(`${link.position.end.line}:${link.position.end.col}: ${link.original}`)
				.addToggle(t => {
					t.setValue(true);
					this._toggleMap.set(file, t);
				})
		})

		new Setting(contentEl).addButton(b => {
			b.setIcon("enter").setButtonText("CONFIRM").onClick(evt => {
				let selected = new Map<TFile, boolean>();
				this._toggleMap.forEach((v, l, _) => {
					selected.set(l, v.getValue());
				})
				this.onSelect(selected);
				this.close();
			})
		})
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

class ObsidianHackMDSettingTab extends PluginSettingTab {
	plugin: ObsidianHackMD;

	constructor(app: App, plugin: ObsidianHackMD) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();
		containerEl.createEl('h3', {text: 'Publish to HackMD - Settings'});

		new Setting(containerEl)
			.setName('API Token')
			.setDesc('Your HackMD API Token. Create new here: https://hackmd.io/settings#api')
			.addText(text => text
				.setPlaceholder('Paste token here')
				.setValue(this.plugin.settings.hackMdApiToken)
				.onChange(async (value) => {
					this.plugin.settings.hackMdApiToken = value;
					await this.plugin.saveSettings();
				}));
	}
}

async function publishFiles(files: TFile[]) : Promise<boolean> {
	for (let file of files) {
		let resp = JSON.parse(await request({
			method: "POST",
			url: new URL('/v1/notes', baseURL).href,
			body: JSON.stringify({
				"title": this.app.workspace.getActiveFile().name,
				"content": await this.app.vault.read(this.app.workspace.getActiveFile()),
				"readPermission": "owner",
				"writePermission": "owner",
				"commentPermission": "everyone"
			}),
			headers: {
				'Authorization': 'Bearer ' + this.settings.hackMdApiToken,
				"Content-Type": "application/json"
			},
		}));

		console.log(resp)

		if (resp.error !== undefined) {
			return false;
		} else {
			new Notice("Published!", 3600)
		}
	}

	return true;
}
