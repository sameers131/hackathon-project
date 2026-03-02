import "dotenv/config";
import net from 'net';
import { promises as fs } from "fs";
import { soInit, soWrite } from './echo-async.js';
import { bufReader } from './bufReader.js';


const server = net.createServer((socket) => {
  newConn(socket).catch((err) => {
    console.error('Error handling connection:', err);
    socket.destroy();
  });});

async function newConn(socket)
{
  const conn = soInit(socket);
  const reader = new bufReader(conn);

  try {
    while(true)
    {
      const data = await reader.readHeaderBytes();
      if(data.length === 0)
        return;
    
      const request = parseHTTPRequest(data);
      console.log("REQ:", request.method, request.path)
      const response = await handleRequest(request, reader);
      await writeHTTPResponse(conn, response);
    }
  }
    catch(err)
    {
      console.error('Error in connection:', err);
    }

    finally{
        socket.destroy();
    }
}


export async function writeHTTPResponse(conn, response)
{
    const reason = statusTest(response.code);
    const body = response.body ?? Buffer.alloc(0);

    let header = `HTTP/1.1 ${response.code} ${reason}\r\n`;

    for (const h of (response.headers ?? []))
    {
        header += `${h}\r\n`;
    }

    header += `Content-Length: ${body.length}\r\n`;
    header += `\r\n`;

    await soWrite(conn, Buffer.from(header, "latin1"));

    if(body.length > 0)
        await soWrite(conn, body);

    function statusTest(code)
    {
        switch(code)
        {
            case 200: return "OK";
            case 400: return "Bad Request";
            case 404: return "Not Found";
            default: return "Unknown";
        }
    }
}

export async function handleRequest(request, reader) {

  if (request.method === "GET" && request.path === "/") {
    request.path = "/index.html";
  }

  if (request.method === "GET" && request.path === "/index.html") {
    const file = await fs.readFile(`${process.cwd()}/scripts/index.html`);
    return {
      code: 200,
      headers: ["Content-Type: text/html; charset=utf-8"],
      body: file,
    };
  }

  if (request.method === "GET" && request.path.startsWith("/api/news")) {
    const u = new URL("http://x" + request.path); // parse query string
    const category = u.searchParams.get("category") ?? "general";

    const apiKey = process.env.NEWS_API_KEY;
    if (!apiKey) {
      return {
        code: 500,
        headers: ["Content-Type: text/plain; charset=utf-8"],
        body: Buffer.from("Missing NEWS_API_KEY in .env\n"),
      };
    }

    const apiURL =
      `https://newsapi.org/v2/top-headlines?country=us&category=${encodeURIComponent(category)}&pageSize=20&apiKey=${apiKey}`;

    const res = await fetch(apiURL);
    const text = await res.text();

    return {
      code: res.ok ? 200 : 400,
      headers: ["Content-Type: application/json; charset=utf-8"],
      body: Buffer.from(text),
    };
  }

  if (request.method === "GET" && request.path === "/news.js") {
    const file = await fs.readFile(`${process.cwd()}/scripts/news.js`);
    return {
      code: 200,
      headers: ["Content-Type: application/javascript; charset=utf-8"],
      body: file,
    };
  }

  if (request.method === "GET" && request.path === "/styles.css") {
    const file = await fs.readFile(`${process.cwd()}/scripts/styles.css`);
    return {
      code: 200,
      headers: ["Content-Type: text/css; charset=utf-8"],
      body: file,
    };
  }


  if (request.method === "POST" && request.path === "/echo") {
    const contentLength = getHTTPHeader(request.headers, "Content-Length");
    if (!contentLength) {
      return {
        code: 400,
        headers: ["Content-Type: text/plain; charset=utf-8"],
        body: Buffer.from("Missing Content-Length\n"),
      };
    }
    const length = parseInt(contentLength, 10);
    const body = length > 0 ? await reader.read(length) : Buffer.alloc(0);
    return {
      code: 200,
      headers: ["Content-Type: application/octet-stream"],
      body,
    };
  }

    

  return {
    code: 404,
    headers: ["Content-Type: text/plain; charset=utf-8"],
    body: Buffer.from("Not found\n"),
  };
}



export function parseHTTPRequest(data)
{
    const text = data.toString();
    const lines = text.split('\r\n');
    
    const parts = lines[0].split(' ');

     if(parts.length !== 3)
        throw new Error('Invalid HTTP request line');

    const method = parts[0];
    const path = parts[1];
    const HTTPversion = parts[2];

    if (!HTTPversion.startsWith("HTTP/")) 
        throw new Error("400 Bad Request: missing HTTP version");

    const version = HTTPversion.slice(5);


    const headers = [];

    for(let i = 1; i < lines.length; i++)
    {
        const line = lines[i];

        if(line === '')
            break;

        headers.push(line);
    }

    return { method, path, version, headers };
}

export function getHTTPHeader(headers, name)
{
    const lowerName = name.toLowerCase();

    for(const header of headers)
    {
        const parts = header.split(':');
        if(parts.length < 2)
            continue;
        const headerName = parts[0].trim().toLowerCase();
        if(headerName === lowerName)
            return parts.slice(1).join(':').trim();
    }

    return null;
}

server.listen(1234, "127.0.0.1", () => {
  console.log("Listening on http://127.0.0.1:1234");
});