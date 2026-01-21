$WshShell = New-Object -ComObject WScript.Shell
$DesktopPath = [Environment]::GetFolderPath('Desktop')
$Shortcut = $WshShell.CreateShortcut("$DesktopPath\Snippet Notebook.lnk")
$Shortcut.TargetPath = "C:\Users\Wang16\Apps\SnippetNotebook\start.vbs"
$Shortcut.WorkingDirectory = "C:\Users\Wang16\Apps\SnippetNotebook"
$Shortcut.Description = "Snippet Notebook - Quick Copy Tool"
$Shortcut.IconLocation = "C:\Users\Wang16\Apps\SnippetNotebook\node_modules\electron\dist\electron.exe,0"
$Shortcut.Save()
Write-Host "Desktop shortcut updated!"
