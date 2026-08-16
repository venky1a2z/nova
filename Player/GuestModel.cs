using SharpGLTF.Schema2;

namespace Nova.Player;

public sealed class GuestModel
{
    public ModelRoot Model
    {
        get;
    }


    public string FilePath
    {
        get;
    }


    private GuestModel(
        ModelRoot model,
        string filePath)
    {
        Model =
            model;

        FilePath =
            filePath;
    }


    public static GuestModel Load()
    {
        string filePath =
            Path.Combine(
                AppContext.BaseDirectory,
                "Assets",
                "character",
                "body",
                "Guest.glb"
            );


        if (
            !File.Exists(
                filePath
            )
        )
        {
            throw new FileNotFoundException(
                "Guest.glb could not be found.",
                filePath
            );
        }


        ModelRoot model =
            ModelRoot.Load(
                filePath
            );


        Console.WriteLine(
            $"Loaded model: {filePath}"
        );


        Console.WriteLine(
            $"Nodes: {model.LogicalNodes.Count}"
        );


        Console.WriteLine(
            $"Meshes: {model.LogicalMeshes.Count}"
        );


        Console.WriteLine(
            $"Materials: {model.LogicalMaterials.Count}"
        );


        Console.WriteLine(
            $"Textures: {model.LogicalTextures.Count}"
        );


        return new GuestModel(
            model,
            filePath
        );
    }
}