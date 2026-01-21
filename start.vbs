Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "C:\Users\Wang16\Apps\SnippetNotebook"
WshShell.Run """C:\Program Files\nodejs\npm.cmd"" start", 0, False
