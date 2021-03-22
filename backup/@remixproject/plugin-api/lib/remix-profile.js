"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.remixProfiles = exports.remixApi = void 0;
const compiler_1 = require("./compiler");
const file_manager_1 = require("./file-system/file-manager");
const editor_1 = require("./editor");
const network_1 = require("./network");
const udapp_1 = require("./udapp");
const theme_1 = require("./theme");
const unit_testing_1 = require("./unit-testing");
const content_import_1 = require("./content-import");
const settings_1 = require("./settings");
const git_1 = require("./git");
const plugin_manager_1 = require("./plugin-manager");
const file_explorers_1 = require("./file-system/file-explorers");
const dgit_1 = require("./dgit");
/** @deprecated Use remixProfiles instead. Will be remove in next version */
exports.remixApi = Object.freeze({
    manager: plugin_manager_1.pluginManagerProfile,
    solidity: Object.assign(Object.assign({}, compiler_1.compilerProfile), { name: 'solidity' }),
    fileManager: Object.assign(Object.assign({}, file_manager_1.filSystemProfile), { name: 'fileManager' }),
    dGitProvider: dgit_1.dGitProfile,
    fileExplorers: file_explorers_1.fileExplorerProfile,
    solidityUnitTesting: Object.assign(Object.assign({}, unit_testing_1.unitTestProfile), { name: 'solidityUnitTesting' }),
    editor: editor_1.editorProfile,
    network: network_1.networkProfile,
    udapp: udapp_1.udappProfile,
    contentImport: content_import_1.contentImportProfile,
    settings: settings_1.settingsProfile,
    theme: theme_1.themeProfile,
});
/** Profiles of all the remix's Native Plugins */
exports.remixProfiles = Object.freeze({
    manager: plugin_manager_1.pluginManagerProfile,
    solidity: Object.assign(Object.assign({}, compiler_1.compilerProfile), { name: 'solidity' }),
    fileManager: Object.assign(Object.assign({}, file_manager_1.filSystemProfile), { name: 'fileManager' }),
    git: Object.assign(Object.assign({}, git_1.gitProfile), { name: 'git' }),
    dGitProvider: dgit_1.dGitProfile,
    solidityUnitTesting: Object.assign(Object.assign({}, unit_testing_1.unitTestProfile), { name: 'solidityUnitTesting' }),
    editor: editor_1.editorProfile,
    network: network_1.networkProfile,
    udapp: udapp_1.udappProfile,
    contentImport: content_import_1.contentImportProfile,
    settings: settings_1.settingsProfile,
    theme: theme_1.themeProfile
});
//# sourceMappingURL=remix-profile.js.map