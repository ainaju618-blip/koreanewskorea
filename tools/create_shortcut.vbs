Set WshShell = CreateObject("WScript.Shell")
DesktopPath = WshShell.SpecialFolders("Desktop")
Set Shortcut = WshShell.CreateShortcut(DesktopPath & "\Korea NEWS Admin.lnk")
Shortcut.TargetPath = "d:\cbt\koreanews\tools\launch_admin.bat"
Shortcut.WorkingDirectory = "d:\cbt\koreanews"
Shortcut.Save
WScript.Echo "OK - Desktop shortcut created!"
