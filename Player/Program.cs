using OpenTK.Mathematics;
using OpenTK.Windowing.Desktop;

namespace Nova.Player;

internal static class Program
{
    [STAThread]
    private static async Task Main(
        string[] args)
    {
        string launchUrl =
            args.Length > 0
                ?
                args[0]
                :
                "nova-player://play?placeId=1";


        /*
         * UPDATE CHECK
         *
         * Debug builds skip this automatically.
         * Release builds check version.json.
         *
         * If an update installer starts,
         * exit the old Player immediately.
         */

        bool updaterStarted =
            await UpdateChecker
                .CheckAndInstallUpdateAsync(
                    launchUrl
                );


        if (
            updaterStarted
        )
        {
            return;
        }


        /*
         * Parse both the game AND
         * character from the URL.
         */

        AvatarConfig avatar =
            AvatarConfig.FromLaunchUrl(
                launchUrl
            );


        WorldData world =
            WorldLoader.Load(
                avatar.PlaceId
            );


        Console.WriteLine(
            "=============================="
        );

        Console.WriteLine(
            "NOVA PLAYER"
        );

        Console.WriteLine(
            $"VERSION {VersionInfo.CurrentVersion}"
        );

        Console.WriteLine(
            "=============================="
        );


        Console.WriteLine(
            $"Launch URL: {launchUrl}"
        );


        Console.WriteLine(
            $"Loading place: {world.PlaceId}"
        );


        Console.WriteLine(
            $"World name: {world.Name}"
        );


        Console.WriteLine(
            $"Creator: {world.Creator}"
        );


        Console.WriteLine(
            $"Parts: {world.Parts.Count}"
        );


        Console.WriteLine(
            "------------------------------"
        );


        Console.WriteLine(
            "AVATAR"
        );


        Console.WriteLine(
            $"Skin: {avatar.Skin}"
        );


        Console.WriteLine(
            $"Face: {avatar.Face}"
        );


        Console.WriteLine(
            $"Shirt: {avatar.Shirt}"
        );


        Console.WriteLine(
            $"Pants: {avatar.Pants}"
        );


        Console.WriteLine(
            $"Hat: {avatar.Hat}"
        );


        Console.WriteLine(
            "=============================="
        );


        var gameWindowSettings =
            GameWindowSettings.Default;


        var nativeWindowSettings =
            new NativeWindowSettings
            {
                ClientSize =
                    new Vector2i(
                        1280,
                        720
                    ),

                Title =
                    $"Nova Player {VersionInfo.CurrentVersion} - {world.Name}"
            };


        using var game =
            new Game(
                gameWindowSettings,
                nativeWindowSettings,
                world,
                avatar
            );


        game.Run();
    }
}
