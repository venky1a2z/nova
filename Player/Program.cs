using OpenTK.Mathematics;
using OpenTK.Windowing.Desktop;


namespace Nova.Player;


internal static class Program
{


    private static void Main(
        string[] args)
    {


        string launchUrl =
            args.Length > 0
                ?
                args[0]
                :
                "nova-player://play?placeId=1";


        /*
         * Parse the place and
         * character from the Nova URL.
         */

        AvatarConfig avatar =
            AvatarConfig.FromLaunchUrl(
                launchUrl
            );


        /*
         * Load the selected Nova place.
         */

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
                    $"Nova Player - {world.Name}"

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