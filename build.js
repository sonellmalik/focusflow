// Build script that explicitly disables code signing
// Usage:
//   node build.js          → builds for current platform
//   node build.js win      → builds Windows .exe installer
//   node build.js mac      → builds macOS .dmg (must run on macOS)
//   node build.js all      → builds both (macOS host only)

process.env.CSC_IDENTITY_AUTO_DISCOVERY = 'false';
process.env.CSC_LINK = 'none';
process.env.WIN_CSC_LINK = 'none';
delete process.env.WIN_CSC_LINK;
delete process.env.CSC_LINK;

const builder = require('electron-builder');
const platform = process.argv[2] || (process.platform === 'darwin' ? 'mac' : 'win');

const sharedConfig = {
    appId: 'com.focusflow.app',
    productName: 'FocusFlow',
    directories: { output: 'dist' },
    files: [
        'main.js',
        'preload.js',
        'mini.html',
        'index.html',
        'css/**/*',
        'js/**/*'
    ],
    win: {
        target: [{ target: 'nsis', arch: ['x64'] }],
        signAndEditExecutable: false,
        sign: null
    },
    mac: {
        target: [{ target: 'dmg', arch: ['x64', 'arm64'] }],
        identity: null,
        category: 'public.app-category.productivity'
    },
    dmg: {
        title: 'FocusFlow',
        contents: [
            { x: 130, y: 220 },
            { x: 410, y: 220, type: 'link', path: '/Applications' }
        ]
    },
    nsis: {
        oneClick: false,
        allowToChangeInstallationDirectory: true,
        createDesktopShortcut: true,
        createStartMenuShortcut: true,
        shortcutName: 'FocusFlow'
    },
    forceCodeSigning: false,
    publish: null
};

let targets;
if (platform === 'mac') {
    targets = builder.Platform.MAC.createTarget('dmg');
} else if (platform === 'win') {
    targets = builder.Platform.WINDOWS.createTarget('nsis', builder.Arch.x64);
} else if (platform === 'all') {
    targets = new Map([
        ...builder.Platform.WINDOWS.createTarget('nsis', builder.Arch.x64),
        ...builder.Platform.MAC.createTarget('dmg')
    ]);
} else {
    console.error('Unknown platform:', platform);
    process.exit(1);
}

console.log(`Building for: ${platform}...`);

builder.build({
    targets,
    config: sharedConfig
}).then(result => {
    console.log('\nBuild complete!');
    console.log('Output:', result);
}).catch(err => {
    console.error('\nBuild failed:', err.message);
    process.exit(1);
});
