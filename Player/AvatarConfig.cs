using OpenTK.Mathematics;

namespace Nova.Player;

public sealed class AvatarConfig
{
    public int PlaceId { get; set; } = 1;

    public string Skin { get; set; } =
        "yellow";

    public string Face { get; set; } =
        "happy";

    public string Shirt { get; set; } =
        "cafe";

    public string Pants { get; set; } =
        "black";

    public string Hat { get; set; } =
        "none";


    public static AvatarConfig FromLaunchUrl(
        string launchUrl)
    {
        var config =
            new AvatarConfig();


        if (
            !Uri.TryCreate(
                launchUrl,
                UriKind.Absolute,
                out Uri? uri
            )
        )
        {
            return config;
        }


        Dictionary<string, string> query =
            ParseQuery(
                uri.Query
            );


        if (
            query.TryGetValue(
                "placeId",
                out string? placeIdText
            ) &&
            int.TryParse(
                placeIdText,
                out int placeId
            )
        )
        {
            config.PlaceId =
                placeId;
        }


        if (
            query.TryGetValue(
                "skin",
                out string? skin
            )
        )
        {
            config.Skin =
                CleanValue(
                    skin,
                    config.Skin
                );
        }


        if (
            query.TryGetValue(
                "face",
                out string? face
            )
        )
        {
            config.Face =
                CleanValue(
                    face,
                    config.Face
                );
        }


        if (
            query.TryGetValue(
                "shirt",
                out string? shirt
            )
        )
        {
            config.Shirt =
                CleanValue(
                    shirt,
                    config.Shirt
                );
        }


        if (
            query.TryGetValue(
                "pants",
                out string? pants
            )
        )
        {
            config.Pants =
                CleanValue(
                    pants,
                    config.Pants
                );
        }


        if (
            query.TryGetValue(
                "hat",
                out string? hat
            )
        )
        {
            config.Hat =
                CleanValue(
                    hat,
                    config.Hat
                );
        }


        return config;
    }


    private static Dictionary<string, string>
        ParseQuery(
            string queryString)
    {
        var result =
            new Dictionary<
                string,
                string
            >(
                StringComparer
                    .OrdinalIgnoreCase
            );


        string cleanQuery =
            queryString
                .TrimStart('?');


        if (
            string.IsNullOrWhiteSpace(
                cleanQuery
            )
        )
        {
            return result;
        }


        foreach (
            string section
            in cleanQuery.Split(
                '&',
                StringSplitOptions
                    .RemoveEmptyEntries
            )
        )
        {
            string[] pair =
                section.Split(
                    '=',
                    2
                );


            string key =
                Uri.UnescapeDataString(
                    pair[0]
                        .Replace(
                            "+",
                            " "
                        )
                );


            string value =
                pair.Length > 1
                    ?
                    Uri.UnescapeDataString(
                        pair[1]
                            .Replace(
                                "+",
                                " "
                            )
                    )
                    :
                    "";


            result[key] =
                value;
        }


        return result;
    }


    private static string CleanValue(
        string value,
        string fallback)
    {
        if (
            string.IsNullOrWhiteSpace(
                value
            )
        )
        {
            return fallback;
        }


        /*
         * Only allow simple item IDs.
         *
         * Prevent things like:
         *
         * ../../file
         *
         * from becoming asset paths.
         */

        string safe =
            new string(
                value
                    .Where(
                        character =>
                            char.IsLetterOrDigit(
                                character
                            ) ||
                            character == '-' ||
                            character == '_'
                    )
                    .ToArray()
            );


        return
            string.IsNullOrWhiteSpace(
                safe
            )
                ?
                fallback
                :
                safe;
    }


    public Vector4 GetSkinColor()
    {
        return Skin
            .ToLowerInvariant()
            switch
            {
                "light" =>
                    HexColor(
                        "#f2c7a5"
                    ),

                "tan" =>
                    HexColor(
                        "#c98f65"
                    ),

                "brown" =>
                    HexColor(
                        "#8c5a3c"
                    ),

                "dark" =>
                    HexColor(
                        "#5a3728"
                    ),

                _ =>
                    HexColor(
                        "#f4d84a"
                    )
            };
    }


    private static Vector4 HexColor(
        string hex)
    {
        string clean =
            hex.TrimStart('#');


        int red =
            Convert.ToInt32(
                clean.Substring(
                    0,
                    2
                ),
                16
            );


        int green =
            Convert.ToInt32(
                clean.Substring(
                    2,
                    2
                ),
                16
            );


        int blue =
            Convert.ToInt32(
                clean.Substring(
                    4,
                    2
                ),
                16
            );


        return new Vector4(
            red / 255f,
            green / 255f,
            blue / 255f,
            1f
        );
    }
}