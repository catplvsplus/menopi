import { BaseModule } from 'reciple';

export class Utility extends BaseModule {
    public stringifyIP(data: Utility.Hostname): string {
        return `${data.host}${data.port ? (':' + data.port) : ''}`;
    }

    public parseIP(ip: string, protocol?: 'JAVA'|'BEDROCK'): Utility.Hostname {
        const arr = ip.trim().toLowerCase().split(':');
        const host = arr.shift() || 'localhost';

        let port = arr[0] ? Number(arr.shift()) : undefined;
            port = typeof port === 'number' && isFinite(port) && !isNaN(port)
                ? port
                : protocol === 'JAVA'
                    ? 25565
                    : protocol === 'BEDROCK'
                        ? 19132
                        : undefined;

        return { host, port };
    }

    public parseBase64ImageURL(url: string): Buffer {
        const [data, base64] = url.split(',');
        const [mime, type] = (data.split(':')[1]?.split(';') ?? []).filter(Boolean);
        if (type.toLowerCase() !== 'base64') throw new Error('URL is not a valid base64');

        return Buffer.from(base64, 'base64');
    }
}

export namespace Utility {
    export interface Hostname {
        host: string;
        port?: number;
    }
}

export default new Utility();