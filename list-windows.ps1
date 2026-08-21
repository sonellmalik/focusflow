# Lists the titles of visible, top-level application windows.
# Uses only user32.dll EnumWindows / GetWindowText / IsWindowVisible.
# It reads window TITLES ONLY — no screen capture, no thumbnails, no content.
# Output: one window title per line (UTF-8).

$ErrorActionPreference = 'SilentlyContinue'

$sig = @"
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Text;

public static class WinList
{
    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern bool IsWindowVisible(IntPtr hWnd);

    [DllImport("user32.dll", CharSet = CharSet.Auto)]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);

    [DllImport("user32.dll", CharSet = CharSet.Auto)]
    public static extern int GetWindowTextLength(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern int GetWindowLong(IntPtr hWnd, int nIndex);

    private const int GWL_EXSTYLE = -20;
    private const int WS_EX_TOOLWINDOW = 0x00000080;

    public static List<string> GetTitles()
    {
        List<string> titles = new List<string>();
        EnumWindows(delegate(IntPtr hWnd, IntPtr lParam)
        {
            if (!IsWindowVisible(hWnd)) return true;

            // Skip tool windows (tray helpers, tooltips, etc.)
            int ex = GetWindowLong(hWnd, GWL_EXSTYLE);
            if ((ex & WS_EX_TOOLWINDOW) != 0) return true;

            int len = GetWindowTextLength(hWnd);
            if (len <= 0) return true;

            StringBuilder sb = new StringBuilder(len + 1);
            GetWindowText(hWnd, sb, sb.Capacity);
            string title = sb.ToString().Trim();
            if (title.Length > 0 && !titles.Contains(title))
            {
                titles.Add(title);
            }
            return true;
        }, IntPtr.Zero);
        return titles;
    }
}
"@

Add-Type -TypeDefinition $sig -Language CSharp | Out-Null

$titles = [WinList]::GetTitles()
foreach ($t in $titles) {
    [Console]::Out.WriteLine($t)
}
