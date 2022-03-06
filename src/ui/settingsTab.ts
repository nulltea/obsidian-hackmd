import {App, PluginSettingTab, Setting} from "obsidian";
import ObsidianHackMD from "../main";

export class ObsidianHackMDSettingTab extends PluginSettingTab {
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
				.setValue(this.plugin.cache.settings.hackMdApiToken)
				.onChange(async (value) => {
					this.plugin.cache.settings.hackMdApiToken = value;
					await this.plugin.saveCache();
				}));
	}
}
