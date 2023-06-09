const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const { resizeImage } = require('./side-effects/resize-image');

// Define some constants based on current running environment/machine
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';
const isMac = process.platform === 'darwin';

// Define some utils
/** @type {(endingPath:string) => string} */
const resolvePathFromRoot = (endingPath) => path.resolve(__dirname, "../", endingPath);

// ======================
// Start Here!
// ======================

// handle creation of "windows" of app
function createMainInsecureWindow() {
  const w = new BrowserWindow({
    width: IS_DEVELOPMENT ? 1000 : 700,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    }
  });

  w.loadFile(resolvePathFromRoot("./renderer/screens/index-insecure/index-insecure.html"))
    .catch(console.error)
    .then(() => {
      // (Only on dev) Open DevTools
      if (IS_DEVELOPMENT) w.webContents.openDevTools();
    });

}
function createMainSecureWindow() {
  const w = new BrowserWindow({
    width: IS_DEVELOPMENT ? 1000 : 700,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      preload: resolvePathFromRoot('./renderer/screens/index-secure/index-secure-preload.js')
    }
  });

  w.loadFile(resolvePathFromRoot("./renderer/screens/index-secure/index-secure.html"))
    .catch(console.error)
    .then(() => {
      // (Only on dev) Open DevTools
      if (IS_DEVELOPMENT) w.webContents.openDevTools();
    });

}
function createAboutWindow() {
  const w = new BrowserWindow({
    width: 300,
    height: 600
  });

  w.loadFile(resolvePathFromRoot("./renderer/screens/about/about.html"))
    .catch(console.error);
}
// handle creation of app menu in the OS status bar (top of the screen when app is focused)
function implementAppMenu() {
  /** @type {import('electron').MenuItemConstructorOptions[]} */
  const menu = [
    ...(isMac ? [
      {
        label: app.name, submenu: [
          { label: 'About', click: createAboutWindow },
          { label: 'Quit', click: app.quit }
        ]
      },
    ] : []),
    {
      label: 'File', submenu: [
        { label: 'Quit', click: app.quit }
      ]
    }
  ];

  const mainMenu = Menu.buildFromTemplate(menu);
  Menu.setApplicationMenu(mainMenu);

}


// 1. When the app starts and is ready...
app.whenReady().then(() => {
  // Create the Main Windows of this App
  createMainInsecureWindow();
  createMainSecureWindow();

  // Create the Menu
  // tht appear in the OS status bar (top of the screen when app is focused)
  implementAppMenu();

  // In macOS apps generally continue running even without any windows open.
  // Activating the app when no windows are available should open a new one
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainInsecureWindow();
      createMainSecureWindow();
    }
  });
});


// When all "windows" of the app are closed...
app.on('window-all-closed', () => {
  // on Mac do nothing because is typical to do that!
  if (isMac) return;

  // quit the app (close completely)
  app.quit();

});


// 2. Register event listeners
// These events will be triggered by the "renderer" windows (UI)
ipcMain.handle('ui--image-resize-submit', (e, payload) => {
  const isSuccess = resizeImage(payload);
  return isSuccess;
});