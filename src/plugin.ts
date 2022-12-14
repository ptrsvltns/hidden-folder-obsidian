import { Notice, Plugin } from 'obsidian';

import lang from './lang';

import HiddenFolderSettingTab from './setting';

export interface HiddenFolderSettings {
  folders: string;
  enable: boolean;
}

const DEFAULT_SETTINGS: HiddenFolderSettings = {
  folders: '',
  enable: false
}

export default class HiddenFolder extends Plugin {
  settings: HiddenFolderSettings;
  observer: MutationObserver;

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
      new Notice(lang.get("Restore display") + '\r\n' + folders.length + ' ' + lang.get(folders.length > 1 ? 'folders' : 'folder'));
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
      new Notice(lang.get("Hidden display") + '\r\n' + count + ' ' + lang.get(count > 1 ? 'folders' : 'folder'));
    }
  }

  async onload() {
    await this.loadSettings();
    this.start(0);
  }

  container: Element | null;
  
  observe() {
    if (!this.container) return;
    this.observer = new MutationObserver(() => {
      this.hiddenFolder();
    });
    this.observer.observe(this.container, { attributes: true, childList: true, subtree: true });
  }

  start(loop: number) {
    if (loop > 20) {
      new Notice(lang.get("Not Found Files List"));
      return;
    }
    this.container = document.querySelector(".nav-files-container");
    if (!this.container) {
      setTimeout(() => {
        this.start(loop + 1);
      }, 100);
      return;
    }
    
    this.observe();

    this.app.workspace.on("layout-change", () => {
      const container = document.querySelector(".nav-files-container");
      if (container !== this.container) {
        this.container = container;
        this.observe();
      }
    })

    this.addSettingTab(new HiddenFolderSettingTab(this.app, this));

    this.hiddenFolder();

    setTimeout(() => {
      const el = this.addRibbonIcon('ghost', lang.get(this.settings.enable ? 'Show Folders' : 'Hidden Folders'), (evt: MouseEvent) => {
        this.settings.enable = !this.settings.enable;
        this.saveSettings();
        el.setAttribute('aria-label', lang.get(this.settings.enable ? 'Show Folders' : 'Hidden Folders'));
        if (this.settings.enable) {
          this.hiddenFolder();
        } else {
          this.restoreFolder();
        }
      });
    }, 10);
  }

  onunload() {
    if (!this.observer) return;
    this.restoreFolder();
    this.observer.disconnect();
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}