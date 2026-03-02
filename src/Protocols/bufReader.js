import { soRead } from './echo-async.js';

export class bufReader
{
    constructor (conn)
    {
        this.conn = conn;
        this.buffer = Buffer.alloc(0);
        this.ended = false;
    }

    async fill()
    {
        if(this.ended)
            return null;

        const chunk = await soRead(this.conn);

        if(chunk.length === 0)
        {
            this.ended = true;
            return null;
        }

        this.buffer = Buffer.concat([this.buffer, chunk]);
        return chunk;
    }

    take(n){
        const out = Buffer.from(this.buffer.subarray(0, n));
        this.buffer = this.buffer.subarray(n);
        return out;
    }

    async read(n)
    {
        while(this.buffer.length < n)
        {
            await this.fill();

            if(this.ended)
                break;
        }

        if(this.buffer.length < n)
            throw new Error('Not enough data');

        return this.take(n);
    }

    async readUntil(delimiter, maxSize = 1024 * 8)
    {
        const d = Buffer.isBuffer(delimiter) ? delimiter : Buffer.from(delimiter);

        while(true){
            const index = this.buffer.indexOf(d);
            if(index !== -1)
                return this.take(index + d.length);

            if(this.buffer.length >= maxSize)
                throw new Error('Delimiter not found within maxSize');

            const chunk = await this.fill();
            if(chunk === null)
                return Buffer.alloc(0);
        }
    }

    async readHeaderBytes(maxSize = 1024 * 8)
    {
        const headerEnd = Buffer.from('\r\n\r\n');
        return this.readUntil(headerEnd, maxSize);
    }

    async discard(n)
    {
        while(this.buffer.length < n && !this.ended)
        {
            await this.fill();
        }

        const drop = Math.min(n, this.buffer.length);
        this.buffer = this.buffer.subarray(drop);
        return drop;
    }
}
