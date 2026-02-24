
const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "Calculadora de Preço PRO",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  // In production, we load the index.html
  win.loadFile('index.html');
  
  // win.webContents.openDevTools(); // Uncomment for debugging
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
