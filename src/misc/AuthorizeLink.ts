import { colors } from '@prtty/prtty';
import { type Client, OAuth2Scopes, PermissionsBitField } from 'discord.js';
import { ClientEventModule } from 'reciple';

export class AuthorizeLink extends ClientEventModule<'clientReady'> {
    public event: 'clientReady' = 'clientReady';

    public async onEvent(client: Client<true>): Promise<void> {
        const link = client.generateInvite({
            scopes: [OAuth2Scopes.ApplicationsCommands, OAuth2Scopes.Bot],
            permissions: [PermissionsBitField.Flags.Administrator]
        });

        useLogger().log(`Invite link: ${colors.green(link)}`);
    }
}

export default new AuthorizeLink();