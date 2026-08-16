namespace Nova.Player;

public sealed class WorldData
{
    public int PlaceId { get; set; }

    public string Name { get; set; } = "Untitled Place";

    public string Creator { get; set; } = "Unknown";

    public List<PartData> Parts { get; set; } = [];
}

public sealed class PartData
{
    public string Name { get; set; } = "Part";

    public float[] Position { get; set; } = [0f, 0f, 0f];

    public float[] Size { get; set; } = [4f, 1f, 2f];

    public float[] Color { get; set; } = [0.6f, 0.6f, 0.6f];

    public bool Anchored { get; set; } = true;
}