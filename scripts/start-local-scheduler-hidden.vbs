' Korea NEWS Local Scheduler - Background Runner
' Double-click to start scheduler in background (no window)
' To stop: Task Manager > Python processes > End Task

Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "D:\cbt\koreanews"
WshShell.Run "pythonw scripts\local_scheduler.py", 0, False
