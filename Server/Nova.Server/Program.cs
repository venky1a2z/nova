using System.Collections.Concurrent;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;


var builder =
    WebApplication.CreateBuilder(args);


/*
 * Always use port 5163 while
 * developing Nova multiplayer.
 */

string port =
    Environment.GetEnvironmentVariable(
        "PORT"
    )
    ??
    "5163";


builder.WebHost.UseUrls(
    $"http://0.0.0.0:{port}"
);


var app =
    builder.Build();


app.UseWebSockets(
    new WebSocketOptions
    {
        KeepAliveInterval =
            TimeSpan.FromSeconds(30)
    }
);


/*
 * Every currently connected client.
 */

var players =
    new ConcurrentDictionary<
        string,
        PlayerConnection
    >();


/* =========================================================
   HOME
========================================================= */

app.MapGet(
    "/",
    () =>
        "Nova Multiplayer Server is alive."
);


/* =========================================================
   STATUS
========================================================= */

app.MapGet(
    "/status",
    () =>
        Results.Json(
            new
            {
                online =
                    players.Count,

                server =
                    "Nova Multiplayer",

                version =
                    "0.1"
            }
        )
);


/* =========================================================
   WEBSOCKET GAME ENDPOINT
========================================================= */

app.Map(
    "/game",
    async context =>
    {


        if (
            !context.WebSockets
                .IsWebSocketRequest
        )
        {

            context.Response.StatusCode =
                400;


            await context.Response
                .WriteAsync(
                    "Nova expected a WebSocket."
                );


            return;

        }


        using WebSocket socket =
            await context
                .WebSockets
                .AcceptWebSocketAsync();


        string connectionId =
            Guid.NewGuid()
                .ToString("N");


        var connection =
            new PlayerConnection(
                connectionId,
                socket
            );


        players[
            connectionId
        ] =
            connection;


        Console.WriteLine(
            $"[CONNECT] {connectionId}"
        );


        try
        {

            await ReceiveLoop(
                connection,
                players
            );

        }
        catch (
            OperationCanceledException
        )
        {
        }
        catch (
            WebSocketException exception
        )
        {

            Console.WriteLine(
                $"[WEBSOCKET ERROR] {exception.Message}"
            );

        }
        catch (
            Exception exception
        )
        {

            Console.WriteLine(
                "[SERVER ERROR]"
            );


            Console.WriteLine(
                exception
            );

        }
        finally
        {


            players.TryRemove(
                connectionId,
                out _
            );


            if (
                connection.Player
                is not null
            )
            {

                Console.WriteLine(
                    $"[LEAVE] " +
                    $"{connection.Player.Username}"
                );


                await BroadcastToPlace(
                    players,

                    connection
                        .Player
                        .PlaceId,

                    new ServerPacket
                    {
                        Type =
                            "player_left",

                        PlayerId =
                            connection
                                .Player
                                .PlayerId
                    },

                    connectionId
                );

            }


            connection.Dispose();


            Console.WriteLine(
                $"[DISCONNECT] {connectionId}"
            );

        }

    }
);


Console.WriteLine(
    "================================="
);

Console.WriteLine(
    "NOVA MULTIPLAYER SERVER"
);

Console.WriteLine(
    "ws://localhost:5163/game"
);

Console.WriteLine(
    "================================="
);


app.Run();



/* =========================================================
   RECEIVE LOOP
========================================================= */

static async Task ReceiveLoop(
    PlayerConnection connection,

    ConcurrentDictionary<
        string,
        PlayerConnection
    > players)
{


    while (
        connection.Socket.State ==
        WebSocketState.Open
    )
    {


        string? json =
            await ReceiveMessage(
                connection.Socket
            );


        if (
            json is null
        )
        {

            break;

        }


        ClientPacket? packet;


        try
        {

            packet =
                JsonSerializer
                    .Deserialize<
                        ClientPacket
                    >(
                        json,
                        JsonSettings.Options
                    );

        }
        catch (
            JsonException exception
        )
        {

            Console.WriteLine(
                $"[BAD JSON] {exception.Message}"
            );


            continue;

        }


        if (
            packet is null
        )
        {

            continue;

        }


        switch (
            packet.Type
                .ToLowerInvariant()
        )
        {


            case "join":

                await HandleJoin(
                    connection,
                    players,
                    packet
                );

                break;


            case "move":

                await HandleMove(
                    connection,
                    players,
                    packet
                );

                break;


            case "ping":

                await connection
                    .SendAsync(
                        new ServerPacket
                        {
                            Type =
                                "pong"
                        }
                    );

                break;

        }

    }

}



/* =========================================================
   PLAYER JOIN
========================================================= */

static async Task HandleJoin(
    PlayerConnection connection,

    ConcurrentDictionary<
        string,
        PlayerConnection
    > players,

    ClientPacket packet)
{


    if (
        connection.Player
        is not null
    )
    {

        return;

    }


    if (
        string.IsNullOrWhiteSpace(
            packet.PlayerId
        )
    )
    {

        Console.WriteLine(
            "[JOIN REJECTED] Missing PlayerId"
        );


        return;

    }


    var player =
        new NetworkPlayerState
        {

            PlayerId =
                packet.PlayerId,

            Username =
                CleanUsername(
                    packet.Username
                ),

            PlaceId =
                packet.PlaceId,

            X =
                packet.X,

            Y =
                packet.Y,

            Z =
                packet.Z,

            Yaw =
                packet.Yaw,

            IsMoving =
                false,

            IsGrounded =
                true,

            VerticalVelocity =
                0f,

            Avatar =
                packet.Avatar
                ??
                new AvatarData()

        };


    connection.Player =
        player;


    Console.WriteLine(
        $"[JOIN] {player.Username} " +
        $"joined Place {player.PlaceId}"
    );


    /*
     * Give new player everybody
     * already in the same place.
     */

    List<NetworkPlayerState>
        existingPlayers =
            players
                .Values
                .Where(
                    other =>

                        other.ConnectionId !=
                            connection.ConnectionId

                        &&

                        other.Player
                            is not null

                        &&

                        other.Player.PlaceId ==
                            player.PlaceId
                )
                .Select(
                    other =>
                        other.Player!
                )
                .ToList();


    await connection
        .SendAsync(
            new ServerPacket
            {

                Type =
                    "snapshot",

                Players =
                    existingPlayers

            }
        );


    /*
     * Tell everyone else
     * that a player joined.
     */

    await BroadcastToPlace(
        players,

        player.PlaceId,

        new ServerPacket
        {

            Type =
                "player_joined",

            Player =
                player

        },

        connection.ConnectionId
    );

}



/* =========================================================
   PLAYER MOVEMENT
========================================================= */

static async Task HandleMove(
    PlayerConnection connection,

    ConcurrentDictionary<
        string,
        PlayerConnection
    > players,

    ClientPacket packet)
{


    NetworkPlayerState?
        player =
            connection.Player;


    if (
        player is null
    )
    {

        return;

    }


    player.X =
        packet.X;


    player.Y =
        packet.Y;


    player.Z =
        packet.Z;


    player.Yaw =
        packet.Yaw;


    player.IsMoving =
        packet.IsMoving;


    player.IsGrounded =
        packet.IsGrounded;


    player.VerticalVelocity =
        packet.VerticalVelocity;


    await BroadcastToPlace(
        players,

        player.PlaceId,

        new ServerPacket
        {

            Type =
                "player_moved",

            PlayerId =
                player.PlayerId,

            X =
                player.X,

            Y =
                player.Y,

            Z =
                player.Z,

            Yaw =
                player.Yaw,

            IsMoving =
                player.IsMoving,

            IsGrounded =
                player.IsGrounded,

            VerticalVelocity =
                player.VerticalVelocity

        },

        connection.ConnectionId
    );

}



/* =========================================================
   BROADCAST TO PLACE
========================================================= */

static async Task BroadcastToPlace(
    ConcurrentDictionary<
        string,
        PlayerConnection
    > players,

    int placeId,

    ServerPacket packet,

    string? exceptConnectionId =
        null)
{


    List<PlayerConnection>
        recipients =
            players
                .Values
                .Where(
                    connection =>

                        connection.Player
                            is not null

                        &&

                        connection.Player.PlaceId ==
                            placeId

                        &&

                        connection.ConnectionId !=
                            exceptConnectionId
                )
                .ToList();


    foreach (
        PlayerConnection recipient
        in recipients
    )
    {

        try
        {

            await recipient
                .SendAsync(
                    packet
                );

        }
        catch (
            Exception exception
        )
        {

            Console.WriteLine(
                $"[SEND ERROR] " +
                $"{exception.Message}"
            );

        }

    }

}



/* =========================================================
   RECEIVE MESSAGE
========================================================= */

static async Task<string?>
    ReceiveMessage(
        WebSocket socket)
{


    byte[] buffer =
        new byte[
            8192
        ];


    using var stream =
        new MemoryStream();


    while (
        true
    )
    {


        WebSocketReceiveResult
            result =
                await socket
                    .ReceiveAsync(
                        new ArraySegment<byte>(
                            buffer
                        ),

                        CancellationToken.None
                    );


        if (
            result.MessageType ==
            WebSocketMessageType.Close
        )
        {

            return null;

        }


        if (
            result.MessageType !=
            WebSocketMessageType.Text
        )
        {

            continue;

        }


        stream.Write(
            buffer,
            0,
            result.Count
        );


        if (
            result.EndOfMessage
        )
        {

            break;

        }

    }


    return Encoding.UTF8
        .GetString(
            stream.ToArray()
        );

}



/* =========================================================
   USERNAME CLEANING
========================================================= */

static string CleanUsername(
    string? username)
{


    if (
        string.IsNullOrWhiteSpace(
            username
        )
    )
    {

        return "NovaPlayer";

    }


    string clean =
        new string(
            username
                .Where(
                    character =>

                        char.IsLetterOrDigit(
                            character
                        )

                        ||

                        character == '_'

                        ||

                        character == '-'
                )
                .Take(30)
                .ToArray()
        );


    return
        string.IsNullOrWhiteSpace(
            clean
        )
            ?
            "NovaPlayer"
            :
            clean;

}



/* =========================================================
   PLAYER CONNECTION
========================================================= */

sealed class PlayerConnection :
    IDisposable
{


    public string ConnectionId
    {
        get;
    }


    public WebSocket Socket
    {
        get;
    }


    public NetworkPlayerState?
        Player
    {
        get;
        set;
    }


    private readonly SemaphoreSlim
        _sendLock =
            new(
                1,
                1
            );


    public PlayerConnection(
        string connectionId,
        WebSocket socket)
    {

        ConnectionId =
            connectionId;


        Socket =
            socket;

    }


    public async Task SendAsync(
        ServerPacket packet)
    {


        if (
            Socket.State !=
            WebSocketState.Open
        )
        {

            return;

        }


        string json =
            JsonSerializer.Serialize(
                packet,
                JsonSettings.Options
            );


        byte[] bytes =
            Encoding.UTF8
                .GetBytes(
                    json
                );


        await _sendLock
            .WaitAsync();


        try
        {

            if (
                Socket.State ==
                WebSocketState.Open
            )
            {

                await Socket
                    .SendAsync(
                        new ArraySegment<byte>(
                            bytes
                        ),

                        WebSocketMessageType.Text,

                        true,

                        CancellationToken.None
                    );

            }

        }
        finally
        {

            _sendLock.Release();

        }

    }


    public void Dispose()
    {

        _sendLock.Dispose();

    }

}



/* =========================================================
   CLIENT PACKET
========================================================= */

sealed class ClientPacket
{


    public string Type
    {
        get;
        set;
    } =
        "";


    public string PlayerId
    {
        get;
        set;
    } =
        "";


    public string Username
    {
        get;
        set;
    } =
        "";


    public int PlaceId
    {
        get;
        set;
    } =
        1;


    public float X
    {
        get;
        set;
    }


    public float Y
    {
        get;
        set;
    }


    public float Z
    {
        get;
        set;
    }


    public float Yaw
    {
        get;
        set;
    }


    public bool IsMoving
    {
        get;
        set;
    }


    public bool IsGrounded
    {
        get;
        set;
    } =
        true;


    public float VerticalVelocity
    {
        get;
        set;
    }


    public AvatarData?
        Avatar
    {
        get;
        set;
    }

}



/* =========================================================
   SERVER PACKET
========================================================= */

sealed class ServerPacket
{


    public string Type
    {
        get;
        set;
    } =
        "";


    public string?
        PlayerId
    {
        get;
        set;
    }


    public NetworkPlayerState?
        Player
    {
        get;
        set;
    }


    public List<NetworkPlayerState>?
        Players
    {
        get;
        set;
    }


    public float X
    {
        get;
        set;
    }


    public float Y
    {
        get;
        set;
    }


    public float Z
    {
        get;
        set;
    }


    public float Yaw
    {
        get;
        set;
    }


    public bool IsMoving
    {
        get;
        set;
    }


    public bool IsGrounded
    {
        get;
        set;
    }


    public float VerticalVelocity
    {
        get;
        set;
    }

}



/* =========================================================
   NETWORK PLAYER STATE
========================================================= */

sealed class NetworkPlayerState
{


    public string PlayerId
    {
        get;
        set;
    } =
        "";


    public string Username
    {
        get;
        set;
    } =
        "NovaPlayer";


    public int PlaceId
    {
        get;
        set;
    }


    public float X
    {
        get;
        set;
    }


    public float Y
    {
        get;
        set;
    }


    public float Z
    {
        get;
        set;
    }


    public float Yaw
    {
        get;
        set;
    }


    public bool IsMoving
    {
        get;
        set;
    }


    public bool IsGrounded
    {
        get;
        set;
    } =
        true;


    public float VerticalVelocity
    {
        get;
        set;
    }


    public AvatarData Avatar
    {
        get;
        set;
    } =
        new();

}



/* =========================================================
   SIMPLE AVATAR DATA

   IMPORTANT:
   This is NOT Nova.Player.AvatarConfig.

   The server only stores strings.
========================================================= */

sealed class AvatarData
{


    public string Skin
    {
        get;
        set;
    } =
        "yellow";


    public string Face
    {
        get;
        set;
    } =
        "happy";


    public string Shirt
    {
        get;
        set;
    } =
        "cafe";


    public string Pants
    {
        get;
        set;
    } =
        "black";


    public string Hat
    {
        get;
        set;
    } =
        "none";

}



/* =========================================================
   JSON SETTINGS
========================================================= */

static class JsonSettings
{


    public static readonly
        JsonSerializerOptions
        Options =
            new()
            {

                PropertyNamingPolicy =
                    JsonNamingPolicy
                        .CamelCase,

                PropertyNameCaseInsensitive =
                    true,

                DefaultIgnoreCondition =
                    JsonIgnoreCondition
                        .WhenWritingNull

            };

}