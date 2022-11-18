import { App, Notice, PluginSettingTab, Setting } from 'obsidian';

import lang from './lang';

import HiddenFolder, { HiddenFolderSettings } from './plugin';

export default class HiddenFolderSettingTab extends PluginSettingTab {
  plugin: HiddenFolder;

  constructor(app: App, plugin: HiddenFolder) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();
    containerEl.createEl('h2', { text: lang.get('Hidden Folder') });

    const settings: HiddenFolderSettings = {
      folders: this.plugin.settings.folders,
      enable: this.plugin.settings.enable
    };
    new Setting(containerEl)
      .setName(lang.get('Rules'))
      .setDesc(lang.get('Regular expression'))
      .addTextArea(text => {
        text.inputEl.style.minWidth = "350px";
        text.inputEl.style.minHeight = "150px";
        text.setPlaceholder(lang.get("Example") + ':\n.*\\/?attachments\n^abc$\nuse multi lines for multi folders')
          .setValue(this.plugin.settings.folders)
          .onChange(async (value) => {
            settings.folders = value;
          });
        return text;
      });
    new Setting(containerEl)
      .setName(lang.get('Enable'))
      .setDesc(lang.get('Enable to hidden folder'))
      .addToggle(toggle => toggle.setValue(this.plugin.settings.enable)
        .onChange((enable) => {
          settings.enable = enable;
        }));
    new Setting(containerEl)
      .addButton(button => button.setButtonText(lang.get('Save'))
        .onClick(async () => {
          new Notice(lang.get("Hidden Folder") + ' - ' + lang.get("Saving"));
          this.plugin.settings.folders = settings.folders;
          this.plugin.settings.enable = settings.enable;
          await this.plugin.saveSettings();
          this.plugin.restoreFolder();
          if (this.plugin.settings.enable) {
            this.plugin.hiddenFolder();
          }
          new Notice(lang.get("Hidden Folder") + ' - ' + lang.get("Settings is saved"));
        }));
  }
}
