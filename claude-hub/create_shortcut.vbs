Set WshShell = CreateObject("WScript.Shell")
Set Shortcut = WshShell.CreateShortcut("C:\Users\user\OneDrive\바탕 화면\Claude Hub.lnk")
Shortcut.TargetPath = "pythonw"
Shortcut.Arguments = "d:\cbt\claude-hub\gui.py"
Shortcut.WorkingDirectory = "d:\cbt\claude-hub"
Shortcut.IconLocation = "shell32.dll,21"
Shortcut.Save
WScript.Echo "Shortcut created!"
