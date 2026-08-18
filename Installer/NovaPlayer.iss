#define MyAppName "Nova Player"
#define MyAppVersion "0.1.3"
#define MyAppPublisher "5r1han"
#define MyAppExeName "Nova.Player.exe"

[Setup]
SetupIconFile=..\Player\Assets\nova-player.ico
AppId={{B7AEE047-544B-48E3-A39A-1FD85A3F0F12}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}

DefaultDirName={autopf}\Nova
DefaultGroupName=Nova

OutputDir=Output
OutputBaseFilename=NovaPlayerSetup

Compression=lzma2
SolidCompression=yes

ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible

PrivilegesRequired=lowest

UninstallDisplayName=Nova Player
UninstallDisplayIcon={app}\{#MyAppExeName}

WizardStyle=modern

CloseApplications=yes
RestartApplications=no


[Files]

Source: "..\Player\bin\Release\net10.0\win-x64\publish\*"; \
    DestDir: "{app}"; \
    Flags: ignoreversion recursesubdirs createallsubdirs


[Icons]

Name: "{group}\Nova Player"; \
    Filename: "{app}\{#MyAppExeName}"

Name: "{userdesktop}\Nova Player"; \
    Filename: "{app}\{#MyAppExeName}"; \
    Tasks: desktopicon


[Tasks]

Name: "desktopicon"; \
    Description: "Create a desktop shortcut"; \
    GroupDescription: "Additional shortcuts:"


[Registry]

Root: HKCU; \
    Subkey: "Software\Classes\nova-player"; \
    ValueType: string; \
    ValueName: ""; \
    ValueData: "URL:Nova Player Protocol"; \
    Flags: uninsdeletekey

Root: HKCU; \
    Subkey: "Software\Classes\nova-player"; \
    ValueType: string; \
    ValueName: "URL Protocol"; \
    ValueData: ""

Root: HKCU; \
    Subkey: "Software\Classes\nova-player\DefaultIcon"; \
    ValueType: string; \
    ValueName: ""; \
    ValueData: """{app}\{#MyAppExeName}"",0"

Root: HKCU; \
    Subkey: "Software\Classes\nova-player\shell"; \
    ValueType: string; \
    ValueName: ""; \
    ValueData: "open"

Root: HKCU; \
    Subkey: "Software\Classes\nova-player\shell\open"; \
    ValueType: string; \
    ValueName: ""; \
    ValueData: ""

Root: HKCU; \
    Subkey: "Software\Classes\nova-player\shell\open\command"; \
    ValueType: string; \
    ValueName: ""; \
    ValueData: """{app}\{#MyAppExeName}"" ""%1"""


[Run]

; Manual install:
; keep the existing post-install checkbox behavior.
Filename: "{app}\{#MyAppExeName}"; \
    Description: "Launch Nova Player"; \
    Flags: nowait postinstall skipifsilent


[Code]

function GetRelaunchUrl(Param: String): String;
begin
  Result := ExpandConstant('{param:NOVA_RELAUNCH|}');
end;


procedure CurStepChanged(CurStep: TSetupStep);
var
  RelaunchUrl: String;
  ResultCode: Integer;
begin
  if CurStep = ssPostInstall then
  begin
    RelaunchUrl := GetRelaunchUrl('');

    if RelaunchUrl <> '' then
    begin
      ShellExec(
        '',
        RelaunchUrl,
        '',
        '',
        SW_SHOWNORMAL,
        ewNoWait,
        ResultCode
      );
    end;
  end;
end;
