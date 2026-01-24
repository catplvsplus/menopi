import { SlashCommandBuilder, SlashCommandModule, type SlashCommand } from 'reciple';
import { EmbedBuilder, InteractionContextType } from 'discord.js';
import JavaProtocol from 'minecraft-protocol';
import BedrockProtocol from 'bedrock-protocol';
import Utility from './Utility.js';

export interface PingData {
    status: 'Online'|'Offline';
    maxPlayers: number;
    onlinePlayers: number;
    version: string|null;
    latency: number|null;
    motd: string|null;
    favicon: Buffer|null;
    pingedAt: Date;
}

export interface PingOptions {
    protocol: 'JAVA'|'BEDROCK';
    host: string;
    port?: number;
    timeout?: number;
}

export type JavaPingOptions = Omit<PingOptions, 'protocol'> & { protocol: 'JAVA'; };
export type BedrockPingOptions = Omit<PingOptions, 'protocol' | 'timeout'> & { protocol: 'BEDROCK'; };

export class PingCommand extends SlashCommandModule {
    public data = new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Ping a Minecraft server')
        .setContexts(
            InteractionContextType.BotDM,
            InteractionContextType.Guild,
            InteractionContextType.PrivateChannel
        )
        .addStringOption(ip => ip
            .setName('ip')
            .setDescription('The IP address of the Minecraft server')
            .setRequired(true)
        )
        .addStringOption(type => type
            .setName('type')
            .setDescription('The type of Minecraft server')
            .setChoices(
                { name: 'Java', value: 'JAVA' },
                { name: 'Bedrock', value: 'BEDROCK' }
            )
            .setRequired(true)
        )
        .toJSON();

    public async execute(data: SlashCommand.ExecuteData): Promise<void> {
        const { interaction } = data;

        const ip = interaction.options.getString('ip', true);
        const protocol = interaction.options.getString('type', true) as 'JAVA'|'BEDROCK';

        await interaction.deferReply();

        const { host, port } = Utility.parseIP(ip);
        const options: PingOptions = {
            host,
            port,
            protocol
        };

        const pingData = await this.ping(options);

        await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setColor(pingData.status === 'Online' ? 'Green' : 'DarkButNotBlack')
                    .setAuthor({
                        name: interaction.user.tag,
                        iconURL: interaction.user.displayAvatarURL()
                    })
                    .setTitle(ip)
                    .setDescription(pingData.motd?.replace(/§[0-9A-FK-OR]/gi, '') || null)
                    .addFields(pingData.status === 'Online'
                        ? [
                            { name: 'Version', value: pingData.version?.replace(/§[0-9A-FK-OR]/gi, '') || 'Unknown', inline: true },
                            { name: 'Latency', value: `${pingData.latency ?? '0'}ms`, inline: true },
                            { name: 'Players', value: `${pingData.onlinePlayers}/${pingData.maxPlayers}`, inline: true }
                        ]
                        : []
                    )
                    .setThumbnail(pingData.favicon ? 'attachment://favicon.png' : null)
                    .setFooter({ text: pingData.status })
                    .setTimestamp(pingData.pingedAt)
            ],
            files: pingData.favicon
                ? [
                    { attachment: Buffer.from(pingData.favicon), name: 'favicon.png' }
                ]
                : [],
            allowedMentions: {
                repliedUser: false,
                parse: []
            }
        });
    }

    public async ping(options: PingOptions): Promise<PingData> {
        switch (options.protocol) {
            case 'JAVA':
                return PingCommand.pingJava(options as JavaPingOptions);
            case 'BEDROCK':
                return PingCommand.pingBedrock(options as BedrockPingOptions);
            default:
                throw new Error('Invalid protocol');
        }
    }

    public static async pingJava(options: JavaPingOptions): Promise<PingData> {
         const pingData = await JavaProtocol.ping({
            host: options.host,
            port: options.port,
            closeTimeout: options.timeout
        }).catch(() => null);

        let status: PingData = {
            status: 'Offline',
            maxPlayers: 0,
            onlinePlayers: 0,
            version: null,
            latency: null,
            motd: null,
            favicon: null,
            pingedAt: new Date()
        };

        if (!pingData) return status;
        if (typeof (pingData as JavaProtocol.NewPingResult).players === 'undefined') return status;

        const newPingResult = pingData as JavaProtocol.NewPingResult;

        status.status = newPingResult.players.max && !newPingResult.version.name.toLowerCase().includes('offline')
            ? 'Online'
            : 'Offline';

        status.maxPlayers = newPingResult.players.max;
        status.onlinePlayers = newPingResult.players.online;
        status.latency = newPingResult.latency;
        status.version = newPingResult.version.name;
        status.motd = typeof newPingResult.description === 'string' ? newPingResult.description : (newPingResult.description.text || null);
        status.favicon = newPingResult.favicon ? Utility.parseBase64ImageURL(newPingResult.favicon) : null;

        return status;
    }

    public static async pingBedrock(options: BedrockPingOptions): Promise<PingData> {
        const pingData = await BedrockProtocol.ping({
            host: options.host,
            port: options.port || 19132
        }).catch(() => null);

        let status: PingData = {
            status: 'Offline',
            maxPlayers: 0,
            onlinePlayers: 0,
            version: null,
            latency: null,
            motd: null,
            favicon: null,
            pingedAt: new Date()
        };

        if (!pingData) return status;

        status.status = pingData.playersMax && !pingData.version.toLowerCase().includes('offline')
            ? 'Online'
            : 'Offline';

        status.maxPlayers = pingData.playersMax;
        status.onlinePlayers = pingData.playersOnline;
        status.latency = null;
        status.version = pingData.version;
        status.motd = pingData?.motd || null;

        return status;
    }
}

export default new PingCommand();