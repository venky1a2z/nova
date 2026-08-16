using System.Text.Json;

namespace Nova.Player;

public static class WorldLoader
{
    public static WorldData Load(int placeId)
    {
        string fileName = $"place-{placeId}.json";

        string filePath = Path.Combine(
            AppContext.BaseDirectory,
            "Worlds",
            fileName
        );

        if (!File.Exists(filePath))
        {
            Console.WriteLine($"World file not found: {filePath}");

            return new WorldData
            {
                PlaceId = placeId,
                Name = $"Missing Place {placeId}"
            };
        }

        string json = File.ReadAllText(filePath);

        WorldData? world = JsonSerializer.Deserialize<WorldData>(
            json,
            new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            }
        );

        return world ?? new WorldData
        {
            PlaceId = placeId,
            Name = "Invalid World"
        };
    }
}