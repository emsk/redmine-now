!macro customInstall
  Var /GLOBAL squirrelUpdater
  StrCpy $squirrelUpdater "$LOCALAPPDATA\RedmineNow\Update.exe"
  IfFileExists $squirrelUpdater UninstallOldVersion EndOfUninstall
  UninstallOldVersion:
  ExecWait '"$squirrelUpdater" --uninstall'
  EndOfUninstall:
!macroend

