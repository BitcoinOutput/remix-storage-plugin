import { toast } from "react-toastify";
import FS from "@isomorphic-git/lightning-fs";
import App, {
  resetFileSystem,
  fileservice,
  fsNoPromise,
  gitservice,
  loaderservice,
  Utils,
} from "../../App";
import { client } from "../../App";
import path from "path";
import { fs } from "../../App";
import { removeSlash, jsonObjectFromFileList, arrayUnique } from "./utils";
import { BehaviorSubject } from "rxjs";
import { fileExplorerNode, fileStatusResult, statusMatrix } from "./types";

export const fileStatuses = [
  ["new,untracked", 0, 2, 0], // new, untracked
  ["added,staged", 0, 2, 2], //
  ["added,staged,with unstaged changes", 0, 2, 3], // added, staged, with unstaged changes
  ["unmodified", 1, 1, 1], // unmodified
  ["modified,unstaged", 1, 2, 1], // modified, unstaged
  ["modified,staged", 1, 2, 2], // modified, staged
  ["modified,staged,with unstaged changes", 1, 2, 3], // modified, staged, with unstaged changes
  ["deleted,unstaged", 1, 0, 1], // deleted, unstaged
  ["deleted,staged", 1, 0, 0],
  ["deleted", 1, 1, 0], // deleted, staged
  ["unmodified", 1, 1, 3],
  ["deleted,not in git", 0, 0, 3],
];

const statusmatrix: statusMatrix[] = fileStatuses.map((x: any) => {
  return {
    matrix: x.shift().split(","),
    status: x,
  };
});

export class LsFileService {
  filetreecontent = new BehaviorSubject<fileExplorerNode>({ children: [] });
  confirmDeletion = new BehaviorSubject<boolean | undefined>(undefined);
  fileStatusResult: fileStatusResult[] = [];

  constructor() {}

  async addFileFromBrowser(file: string) {
    try {
      const content = await client.call(
        "fileManager",
        "readFile",
        Utils.addSlash(file)
      );
      ////Utils.log(content);
      await this.addFile(file, content);
      //return content
    } catch (e) {}
  }

  // RESET FUNCTIONS

  async clearDb() {
    const req = indexedDB.deleteDatabase("remix-workspace");
    let me = this;
    req.onsuccess = async function () {
      toast("Deleted database successfully");
      //await me.gitlog()

      await me.showFiles();
      await gitservice.init();
    };
  }

  async clearFilesInIde() {
    await client.disableCallBacks();
    var files = await client.call("fileManager", "readdir", "/");
    let fileArray = normalize(files)
    for (let i = 0; i < fileArray.length; i++) {
      let fi: any = fileArray[i];
      try {
        await client.call(
          "fileManager",
          "remove",
          Utils.addSlash(fi.filename)
        );
      } catch (e) {
        //Utils.log(e);
      }
    }
    await client.enableCallBacks();
    return true;
  }

  async clearFilesInWorkingDirectory() {
    // files in FS
    const files = await gitservice.getStatusMatrixFiles();
    for (let i = 0; i < files.length; i++) {
      await this.rmFile(files[i]);
    }
  }

  async startNewRepo() {
    await resetFileSystem(true);
    await this.syncFromBrowser();
    await gitservice.init();
    await gitservice.clearRepoName();
  }

  async syncStart() {
    //await resetFileSystem();
    await this.syncFromBrowser();
    await gitservice.init();
  }

  // SYNC FUNCTIONS
  // TODO: remove
  async syncToBrowser() {
    return true
    //this.showspinner();
    loaderservice.setLoading(true);
    await client.disableCallBacks();
    let filesToSync = [];
    // first get files in current commit, not the files in the FS because they can be changed or unstaged

    let filescommited = await gitservice.listFiles();
    const currentcommitoid = await gitservice.getCommitFromRef("HEAD");
    for (let i = 0; i < filescommited.length; i++) {
      const ob = {
        path: filescommited[i],
        content: await gitservice.getFileContentCommit(
          filescommited[i],
          currentcommitoid
        ),
      };
      //Utils.log("sync file", ob);
      try {
        await client.call(
          "fileManager",
          "setFile",
          Utils.addSlash(ob.path),
          ob.content
        );
      } catch (e) {
        //Utils.log("could not load file", e);
        loaderservice.setLoading(false);
      }
      filesToSync.push(ob);
    }
    //Utils.log("files to sync", filesToSync);

    await this.showFiles();
    await client.enableCallBacks();
    toast.success("Import successfull");
    loaderservice.setLoading(false);
  }

  async syncFromBrowser() {
    await client.disableCallBacks();
    let files = await this.getDirectoryFromIde("/");
    console.log("SYNC DONE", files)
    await this.showFiles();
    await client.enableCallBacks();
  }

  async addFile(file: string, content: string) {
    //Utils.log("add file ", file);
    const directories = path.dirname(file);
    await this.createDirectoriesFromString(directories);
    ////Utils.log(fs);
    await fs.writeFile("/" + file, content);
  }

  async rmFile(file: string) {
    try {
      //Utils.log("rm file ", file);
      await fs.unlink("/" + file);
    } catch (e) {}
    //await this.showFiles();
  }

  async createDirectoriesFromString(strdirectories: string) {
    const ignore = [".", "/.", ""];
    ////Utils.log("directory", strdirectories, ignore.indexOf(strdirectories));
    if (ignore.indexOf(strdirectories) > -1) return false;
    let directories: string[] = strdirectories.split("/");
    ////Utils.log("create directory", directories);
    for (let i = 0; i < directories.length; i++) {
      ////Utils.log(directories[i]);
      let previouspath = "";
      if (i > 0) previouspath = "/" + directories.slice(0, i).join("/");
      const finalPath = previouspath + "/" + directories[i];
      ////Utils.log("creating ", finalPath);
      try {
        await fs.mkdir(finalPath);
      } catch (e) {
        // //Utils.log(e)
      }
    }
  }

  async viewFile(args: any) {
    const filename = args;
    //Utils.log("view file", filename);
    //$(args[0].currentTarget).data('file')
    try {
      await client.call("fileManager", "open", Utils.addSlash(filename));
    } catch (e) {
      toast.error("file does not exist in Remix", { autoClose: false });
    }
  }

  async getFileStatusMatrix() {
    this.fileStatusResult = await gitservice.statusMatrix();
    Utils.log("STATUS MATRIX", this.fileStatusResult);
    // let filesinstaging = await gitservice.listFilesInstaging();
    // //Utils.log("FILES IN STAGING", filesinstaging);
    // let filesingit = await gitservice.listFiles();
    // //Utils.log("FILES IN GIT", filesingit);

    this.fileStatusResult.map((m) => {
      statusmatrix.map((sm) => {
        if (JSON.stringify(sm.status) === JSON.stringify(m.status)) {
          //Utils.log(m, sm);
          m.statusNames = sm.matrix;
        }
      });
    });
    Utils.log("file status", this.fileStatusResult);
  }

  getFilesByStatus(status: string) {
    let count = 0;
    ////Utils.log("STATUS?", status);
    this.fileStatusResult.map((m) => {
      ////Utils.log("STATUS?", m);
      if (m.statusNames !== undefined) {
        if (m.statusNames?.indexOf(status) > -1) {
          count++;
          ////Utils.log("COUNT", count);
        }
      }
    });
    return count;
  }

  getFileStatusForFile(filename: string) {
    ////Utils.log("checking file status", filename);
    for (let i: number = 0; i < this.fileStatusResult.length; i++) {
      if (this.fileStatusResult[i].filename === filename)
        return this.fileStatusResult[i].statusNames;
    }
  }

  async showFiles() {
    //$('#files').show()
    //$('#diff-container').hide()
    let files = await gitservice.getStatusMatrixFiles(); //await this.getDirectory("/");
    console.log("start get files")
    console.log("matrix files", files)
    let filesinbrowser = await this.getDirectoryFromIde("/");
    //Utils.log("get matrix result", files, filesinbrowser);

    try {
      await this.getFileStatusMatrix();
      Utils.log("files", files);
      let jsonfiles = await jsonObjectFromFileList(
        arrayUnique(filesinbrowser.concat(files))
      );
      Utils.log("json files", jsonfiles);
      this.filetreecontent.next(jsonfiles);
    } catch (e) {
      //Utils.log(e);
    }
    try {
      await gitservice.gitlog();
    } catch (e) {}
    try {
      await gitservice.getBranches();
    } catch (e) {}
    await gitservice.checkForFilesCommmited();
    return true;
  }

  async getDirectory(dir: string) {
    //Utils.log("get directory");
    let result: string[] = [];
    const files = await client.call("fileManager", "readdir", dir);
    //Utils.log(files);

    for (let i = 0; i < files.length; i++) {
      const fi = files[i];
      if (typeof fi !== "undefined") {
        // //Utils.log('looking into ', fi, dir)
        if (dir === "/") dir = "";
        const type = await fs.stat(`${dir}/${fi}`);
        if (type.type === "dir") {
          // //Utils.log('is directory, so get ', `${dir}/${fi}`)
          result = [...result, ...(await this.getDirectory(`${dir}/${fi}`))];
        } else {
          // //Utils.log('is file ', `${dir}/${fi}`)
          result.push(`${dir}/${fi}`);
        }
      }
    }
    //Utils.log(result);
    return result;
  }

  async getDirectoryFromIde(dir: string, onlyDirectories: boolean = false) {
    //Utils.log("get directory from ide", dir);
    let result: string[] = [];
    if (!dir.startsWith("/")) {
      dir = "/" + dir;
    }
    const files = await client.call("fileManager", "readdir", dir);
    Utils.log("READDIR", files);
    Utils.log("normalize", normalize(files))

    let fileArray = normalize(files)

    Utils.log(fileArray);

    for (let i = 0; i < fileArray.length; i++) {
      let fi: any = fileArray[i];
      if (typeof fi !== "undefined") {
        ////Utils.log('looking into ', fi, dir)
        //if (dir === "/") dir = "";
        //dir = removeSlash(dir)
        let type = fi.data.isDirectory;
        ////Utils.log("type",type)
        if (type === true) {
          //Utils.log("is directory, so get ", `${fi.filename}`);
          if (onlyDirectories === true) result = [...result, fi.filename];

          result = [
            ...result,
            ...(await this.getDirectoryFromIde(
              `${fi.filename}`,
              onlyDirectories
            )),
          ];
        } else {
          //Utils.log("is file ", `${fi.filename}`);
          if (onlyDirectories === false) result = [...result, fi.filename];
        }
      }
    }

    Utils.log("TREE", result);
    return result;
  }
}

const normalize = (filesList:any): File[] => {
  const folders:any[] = []
  const files:any[] = []
  //const prefix = path.split('/')[0]

  Object.keys(filesList || {}).forEach(key => {
    //const path = prefix + '/' + key

    if (filesList[key].isDirectory) {
      folders.push({
        filename:key,
        data: filesList[key]
      })
    } else {
      files.push({
        filename:key,
        data: filesList[key]
      })
    }
  })

  return [...folders, ...files]
}

