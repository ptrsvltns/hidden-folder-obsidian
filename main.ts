import { App, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

interface HiddenFolderSettings {
	folders: string;
	enable: boolean;
}

const DEFAULT_SETTINGS: HiddenFolderSettings = {
	folders: '',
	enable: false
}

export default class HiddenFolder extends Plugin {
	settings: HiddenFolderSettings;

	getFilters() {
		if (!this.settings.folders) return null;
		const result = [];
		const folders = this.settings.folders.split("\n");
		if (folders.length) {
			for (let i of folders) {
				result.push(new RegExp(i));
			}
		}
		return result;
	}

	getFolderElements() {
		const folders = document.querySelectorAll(".nav-folder");
		const result = [];
		for (let i = 0; i < folders.length; i++) {
			const el = folders[i];
			if (el.classList.contains("mod-root")) continue;
			result.push(el);
		}
		return result;
	}

	restoreFolder() {
		const folders = document.querySelectorAll(".hidden-folder-flag-hidden");
		if (folders?.length) {
			new Notice('restore display ' + folders.length + ' folder' + (folders.length > 1 ? 's' : ''));
			for (let i = 0; i < folders.length; i++) {
				const el = folders[i];
				el.classList.remove("hidden-folder-flag-hidden");
			}
		}
	}

	hiddenFolder() {
		if (!this.settings.enable) return;
		const filters = this.getFilters();
		if (!filters?.length) return;
		const elements = this.getFolderElements();
		let count = 0;
		for (let el of elements) {
			const title = el.querySelector(".nav-folder-title");
			const path = title?.getAttribute("data-path");
			if (!path) continue;
			if (el.classList.contains("hidden-folder-flag-hidden")) continue;
			for (let filter of filters) {
				if (filter.test(path)) {
					el.classList.add("hidden-folder-flag-hidden");
					count++;
				}
			}
		}
		if (count) {
			new Notice('hidden ' + count + ' folder' + (count > 1 ? 's' : ''));
		}
	}

	subtreeModified = (e: Event) => {
		if (e.target instanceof HTMLDivElement) {
			const el: HTMLDivElement = e.target;
			if (el.classList.contains("nav-folder-children")) {
				this.hiddenFolder();
			}
		}
	}

	async onload() {
		await this.loadSettings();

		this.addSettingTab(new HiddenFolderSettingTab(this.app, this));

		document.addEventListener('DOMSubtreeModified', this.subtreeModified);

		this.hiddenFolder();
		
		setTimeout(() => {
			const el = this.addRibbonIcon('ghost', (this.settings.enable ? 'Show' : 'Hidden') + ' Folders', (evt: MouseEvent) => {
				this.settings.enable = !this.settings.enable;
				this.saveSettings();
				el.setAttribute('aria-label', (this.settings.enable ? 'Show' : 'Hidden') + ' Folders');
				if (this.settings.enable) {
					this.hiddenFolder();
				} else {
					this.restoreFolder();
				}
			});
		}, 50);

	}

	onunload() {
		this.restoreFolder();

		document.removeEventListener('DOMSubtreeModified', this.subtreeModified);
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class HiddenFolderSettingTab extends PluginSettingTab {
	plugin: HiddenFolder;

	constructor(app: App, plugin: HiddenFolder) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();
		containerEl.createEl('h2', {text: 'Hidden Folder'});

		const settings: HiddenFolderSettings = {
			folders: this.plugin.settings.folders,
			enable: this.plugin.settings.enable
		};
		new Setting(containerEl)
			.setName('Folders')
			.setDesc('Regular expression')
			.addTextArea(text => {
				text.inputEl.style.minWidth = "350px";
				text.inputEl.style.minHeight = "150px";
				text.setPlaceholder('.*\\/?attachments\n^abc$\nuse multi lines for multi folders')
					.setValue(this.plugin.settings.folders)
					.onChange(async (value) => {
						settings.folders = value;
					});
				return text;
			});
		new Setting(containerEl)
			.setName('Enable')
			.setDesc('Hidden Folder Enable')
			.addToggle(toggle => toggle.setValue(this.plugin.settings.enable)
				.onChange((enable) => {
					settings.enable = enable;
				}));
		new Setting(containerEl)
			.addButton(button => button.setButtonText('Save')
				.onClick(async () => {
					new Notice('Hidden Folder Saving');
					this.plugin.settings.folders = settings.folders;
					this.plugin.settings.enable = settings.enable;
					await this.plugin.saveSettings();
					this.plugin.restoreFolder();
					if (this.plugin.settings.enable) {
						this.plugin.hiddenFolder();
					}
					new Notice('Hidden Folder Success');
				}));
	}
}
