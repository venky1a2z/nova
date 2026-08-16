using System.Diagnostics;
using System.Net.Http.Json;
using System.Reflection;
using System.Text.Json.Serialization;

namespace Nova.Player;

public static class UpdateChecker
{
    // CHANGE THIS after you deploy the Nova website.
    // Example:
    // https://your-domain.com/downloads/version.json
    private const string VersionManifestUrl =
        "https://https://betternova.netlify.app/downloads/version.json";

    private static readonly HttpClient Http =
        new()
        {
            Timeout = TimeSpan.FromSeconds(15)
        };

    public static async Task<bool> CheckAndInstallUpdateAsync(
        string originalLaunchUrl)
    {
#if DEBUG
        Console.WriteLine(
            "Nova updater: DEBUG build, update check skipped."
        );

        return false;
#else
        try
        {
            Console.WriteLine(
                $"Nova Player version: {VersionInfo.CurrentVersion}"
            );

            Console.WriteLine(
                "Checking for Nova Player updates..."
            );

            UpdateManifest? manifest =
                await Http.GetFromJsonAsync<UpdateManifest>(
                    VersionManifestUrl
                );

            if (
                manifest is null
                ||
                string.IsNullOrWhiteSpace(
                    manifest.Version
                )
                ||
                string.IsNullOrWhiteSpace(
                    manifest.InstallerUrl
                )
            )
            {
                Console.WriteLine(
                    "Nova updater: invalid update manifest."
                );

                return false;
            }

            if (
                !Version.TryParse(
                    VersionInfo.CurrentVersion,
                    out Version? installedVersion
                )
                ||
                !Version.TryParse(
                    manifest.Version,
                    out Version? latestVersion
                )
            )
            {
                Console.WriteLine(
                    "Nova updater: invalid version number."
                );

                return false;
            }

            if (
                latestVersion <= installedVersion
            )
            {
                Console.WriteLine(
                    "Nova Player is up to date."
                );

                return false;
            }

            Console.WriteLine(
                $"Nova Player update available: " +
                $"{installedVersion} -> {latestVersion}"
            );

            string tempDirectory =
                Path.Combine(
                    Path.GetTempPath(),
                    "NovaPlayer",
                    "Updates"
                );

            Directory.CreateDirectory(
                tempDirectory
            );

            string installerPath =
                Path.Combine(
                    tempDirectory,
                    $"NovaPlayerSetup-{latestVersion}.exe"
                );

            Console.WriteLine(
                "Downloading Nova Player update..."
            );

            using (
                HttpResponseMessage response =
                    await Http.GetAsync(
                        manifest.InstallerUrl,
                        HttpCompletionOption.ResponseHeadersRead
                    )
            )
            {
                response.EnsureSuccessStatusCode();

                await using Stream source =
                    await response.Content.ReadAsStreamAsync();

                await using FileStream destination =
                    File.Create(
                        installerPath
                    );

                await source.CopyToAsync(
                    destination
                );
            }

            Console.WriteLine(
                $"Update downloaded to: {installerPath}"
            );

            string relaunchUrl =
                string.IsNullOrWhiteSpace(
                    originalLaunchUrl
                )
                    ?
                    "nova-player://play?placeId=1"
                    :
                    originalLaunchUrl;

            string arguments =
                "/SP- " +
                "/VERYSILENT " +
                "/SUPPRESSMSGBOXES " +
                "/NORESTART " +
                "/CLOSEAPPLICATIONS " +
                "/NORESTARTAPPLICATIONS " +
                $"/NOVA_RELAUNCH=\"{EscapeArgument(relaunchUrl)}\"";

            ProcessStartInfo startInfo =
                new()
                {
                    FileName =
                        installerPath,

                    Arguments =
                        arguments,

                    UseShellExecute =
                        true
                };

            Process.Start(
                startInfo
            );

            Console.WriteLine(
                "Nova updater started. Closing old Player..."
            );

            return true;
        }
        catch (
            Exception exception
        )
        {
            Console.WriteLine(
                "Nova updater could not check for updates."
            );

            Console.WriteLine(
                exception.Message
            );

            // Update failure should not stop the Player for now.
            return false;
        }
#endif
    }

    private static string EscapeArgument(
        string value)
    {
        return value
            .Replace(
                "\"",
                "\\\""
            );
    }

    private sealed class UpdateManifest
    {
        [JsonPropertyName("version")]
        public string Version
        {
            get;
            set;
        }
        =
            "";

        [JsonPropertyName("installerUrl")]
        public string InstallerUrl
        {
            get;
            set;
        }
        =
            "";

        [JsonPropertyName("required")]
        public bool Required
        {
            get;
            set;
        }
    }
}
