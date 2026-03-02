import net from 'net';

export function soInit(socket)
{
  const conn = {
    socket,
    error: null,
    end: false,
    reader: null,
    queue: []
  };

  socket.pause();

  socket.on('data', (data) => {

    socket.pause();

    if(conn.reader){
      const resolve = conn.reader.resolve;
      conn.reader = null;
      resolve(data);
    }

    else{
      conn.queue.push(data);
    }
  });
  
  socket.on('end', () => {
    conn.end = true;

    if(conn.reader){
      const resolve = conn.reader.resolve;
      conn.reader = null;
      resolve(Buffer.alloc(0));
    }
  });

  socket.on('error', (err) => {
    conn.error = err;

    if(conn.reader)
    {
      const reject = conn.reader.reject;
      conn.reader = null;
      reject(err);
    }
  });

  return conn;

}

export function soRead(conn)
{
  if(conn.queue.length > 0){
    return Promise.resolve(conn.queue.shift());
  }

  if(conn.end){
    return Promise.resolve(Buffer.alloc(0));
  }

  if(conn.error){
    return Promise.reject(conn.error);
  }

  if(conn.reader)
    throw new Error('Another read operation is in progress');

  return new Promise((resolve, reject) => {
      conn.reader = { resolve, reject };
      conn.socket.resume();
  });
}

export function soWrite(conn, data) {
  if (!data || data.length === 0) 
    return Promise.resolve();

  if (conn.error) 
    return Promise.reject(conn.error);

    return new Promise((resolve, reject) => {
      conn.socket.write(data, (err) => {
        if (err) 
          reject(err);
        else 
          resolve();
      });
  });
}