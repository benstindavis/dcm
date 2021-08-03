const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { start } = require("repl");
const { autoUpdater } = require("electron-updater");

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  // eslint-disable-line global-require
  app.quit();
}

let startWindow = null;
const main = () => {
  startWindow = new BrowserWindow({
    width: 400,
    height: 300,
    devTools: false,
    resizable: false,
    fullscreen: false,
    frame: false,
    icon: path.join(__dirname, "images/icon.jpg"),

    webPreferences: {
      contextIsolation: false,

      preload: path.join(__dirname, "preload.js"),
    },
  });

  startWindow.setMenuBarVisibility(false);
  startWindow.webContents.openDevTools();

  startWindow.loadFile(path.join(__dirname, "src/start.html"));
  startWindow.once("ready-to-show", () => {
    autoUpdater.checkForUpdatesAndNotify();
  });

  startWindow.on("closed", () => {
    // Create the main browser window.
    const mainWindow = new BrowserWindow({
      width: 1366,
      height: 768,
      devTools: false,
      resizable: false,
      fullscreen: true,
      frame: false,
      icon: path.join(__dirname, "images/icon.jpg"),
    });
    // remove the menu bar
    mainWindow.setMenuBarVisibility(false);

    // and load the index.html of the app.
    mainWindow.loadFile(path.join(__dirname, "src/index.html"));
    // Open the DevTools.
    //mainWindow.webContents.openDevTools();
  });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", main);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    main();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

ipcMain.on("app_version", (event) => {
  event.sender.send("app_version", { version: app.getVersion() });
});

//-------------------------------------------------------------------
// Auto updates
//-------------------------------------------------------------------
const sendStatusToWindow = (text) => {
  if (startWindow) {
    startWindow.webContents.send("message", text);
  }
};

autoUpdater.on("checking-for-update", () => {
  sendStatusToWindow("Checking for update...");
});
autoUpdater.on("update-available", (info) => {
  sendStatusToWindow("Update available. Please wait.");
});
autoUpdater.on("update-not-available", (info) => {
  sendStatusToWindow("Update not available.");
});
autoUpdater.on("error", (err) => {
  sendStatusToWindow(
    'Error in auto-updater: Try again later.'
  );
});
autoUpdater.on("download-progress", (progressObj) => {
  sendStatusToWindow(
    `Download speed: ${formatBytes(
      progressObj.bytesPerSecond
    )}/s - Downloaded ${
      Math.round(progressObj.percent * 100) / 100
    }% (${formatBytes(progressObj.transferred)}/${formatBytes(
      progressObj.total
    )})`
  );
});
autoUpdater.on("update-downloaded", (info) => {
  sendStatusToWindow("Update downloaded; will install now");
});

autoUpdater.on("update-downloaded", (info) => {
  // Wait 5 seconds, then quit and install
  // In your application, you don't need to wait 500 ms.
  // You could call autoUpdater.quitAndInstall(); immediately
  autoUpdater.quitAndInstall();
});

// utils

function formatBytes(a, b = 2) {
  if (0 === a) return "0 Bytes";
  const c = 0 > b ? 0 : b,
    d = Math.floor(Math.log(a) / Math.log(1024));
  return (
    parseFloat((a / Math.pow(1024, d)).toFixed(c)) +
    " " +
    ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"][d]
  );
}
