using OpenTK.Graphics.OpenGL4;
using StbImageSharp;

namespace Nova.Player;

public static class TextureLoader
{
    public static int LoadTexture(string relativePath)
    {
        string fullPath = Path.Combine(
            AppContext.BaseDirectory,
            relativePath
        );

        if (!File.Exists(fullPath))
        {
            throw new FileNotFoundException(
                $"Texture not found: {fullPath}"
            );
        }

        StbImage.stbi_set_flip_vertically_on_load(1);

        using FileStream stream = File.OpenRead(fullPath);

        ImageResult image = ImageResult.FromStream(
            stream,
            ColorComponents.RedGreenBlueAlpha
        );

        int texture = GL.GenTexture();

        GL.BindTexture(
            TextureTarget.Texture2D,
            texture
        );

        GL.TexImage2D(
            TextureTarget.Texture2D,
            0,
            PixelInternalFormat.Rgba,
            image.Width,
            image.Height,
            0,
            PixelFormat.Rgba,
            PixelType.UnsignedByte,
            image.Data
        );

        GL.TexParameter(
            TextureTarget.Texture2D,
            TextureParameterName.TextureMinFilter,
            (int)TextureMinFilter.LinearMipmapLinear
        );

        GL.TexParameter(
            TextureTarget.Texture2D,
            TextureParameterName.TextureMagFilter,
            (int)TextureMagFilter.Linear
        );

        GL.TexParameter(
            TextureTarget.Texture2D,
            TextureParameterName.TextureWrapS,
            (int)TextureWrapMode.Repeat
        );

        GL.TexParameter(
            TextureTarget.Texture2D,
            TextureParameterName.TextureWrapT,
            (int)TextureWrapMode.Repeat
        );

        GL.GenerateMipmap(
            GenerateMipmapTarget.Texture2D
        );

        GL.BindTexture(
            TextureTarget.Texture2D,
            0
        );

        return texture;
    }
}