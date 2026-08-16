using OpenTK.Mathematics;
using OpenTK.Windowing.Desktop;

namespace Nova.Player;

internal static class Program
{
    private static void Main(string[] args)
    {
        string launchUrl = args.Length > 0
            ? args[0]
            : "nova-player://play?placeId=1";

        int placeId = GetPlaceId(launchUrl);

        WorldData world = WorldLoader.Load(placeId);

        Console.WriteLine($"Loading place: {world.PlaceId}");
        Console.WriteLine($"World name: {world.Name}");
        Console.WriteLine($"Creator: {world.Creator}");
        Console.WriteLine($"Parts: {world.Parts.Count}");

        var gameWindowSettings = GameWindowSettings.Default;

        var nativeWindowSettings = new NativeWindowSettings
        {
            ClientSize = new Vector2i(1280, 720),
            Title = $"Nova Player - {world.Name}"
        };

        using var game = new Game(
            gameWindowSettings,
            nativeWindowSettings,
            world
        );

        game.Run();
    }

    private static int GetPlaceId(string launchUrl)
    {
        if (!Uri.TryCreate(
                launchUrl,
                UriKind.Absolute,
                out Uri? uri))
        {
            return 1;
        }

        string query = uri.Query.TrimStart('?');

        foreach (string section in query.Split('&'))
        {
            string[] pair = section.Split('=', 2);

            if (
                pair.Length == 2 &&
                pair[0].Equals(
                    "placeId",
                    StringComparison.OrdinalIgnoreCase
                ) &&
                int.TryParse(pair[1], out int placeId)
            )
            {
                return placeId;
            }
        }

        return 1;
    }
}