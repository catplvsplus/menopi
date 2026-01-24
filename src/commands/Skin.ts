import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, InteractionContextType } from 'discord.js';
import { SlashCommandBuilder, SlashCommandModule, type SlashCommand } from 'reciple';

export class SkinCommand extends SlashCommandModule {
    public data = new SlashCommandBuilder()
        .setName('skin')
        .setContexts(
            InteractionContextType.BotDM,
            InteractionContextType.Guild,
            InteractionContextType.PrivateChannel
        )
        .setDescription('Get a Minecraft skin')
        .addStringOption(id => id
            .setName('id')
            .setDescription('The player username, UUID, Floodgate UUID, or Minecraft Texture ID')
            .setRequired(true)
        )
        .toJSON();

    public async execute(data: SlashCommand.ExecuteData): Promise<void> {
        const { interaction } = data;

        const name = interaction.options.getString('id', true);

        await interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor('Green')
                    .setAuthor({
                        name: interaction.user.tag,
                        iconURL: interaction.user.displayAvatarURL()
                    })
                    .setTitle(name)
                    .setThumbnail(`https://mc-heads.net/body/${name}`)
                    .setImage(`https://mc-heads.net/avatar/${name}`)
                    .setTimestamp()
            ],
            components: [
                new ActionRowBuilder<ButtonBuilder>()
                    .setComponents(
                        new ButtonBuilder()
                            .setStyle(ButtonStyle.Link)
                            .setLabel('Download')
                            .setURL(`https://mc-heads.net/download/${name}`)
                    )
            ],
            allowedMentions: {
                repliedUser: false,
                parse: []
            }
        });
    }
}

export default new SkinCommand();