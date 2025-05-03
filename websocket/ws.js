const websocket=require('ws');
const request=require('request');

const server= new websocket.Server({
    port:12345
});
server.on('open', function server_open(){
    console.log('server open');
});
server.on('close', function server_close(){
    console.log('server close');
});
let clients={};
server.on('connection', function connection(ws,req){
    const ip = req.socket.remoteAddress;
    const port = req.socket.remotePort;
    const client = ip + port;
    
    ws.on('open',function client_open(){
        console.log('client open');
    });
    ws.on('close',function client_close(){
        console.log('client close');
    });
    ws.send('{"type":"system","code":"success","content":"'+client+'，连接成功！"}');
    ws.on('message', function receive_message(message){
        console.log('发现消息：'+message);
        let json=JSON.parse(message);
        if(json){
            console.log('格式化成功');
            clients[json.from_id]=ws;//始终存入，保证是该用户的最新的客户端示例，如果需要支持用户的多个客户端示例，则需要在该用户下存入多个客户端，都转发消息
            if(json.to_id){
                console.log('发送对象：'+json.to_id);
                if(clients[json.to_id]){
                    console.log('对方在线：'+clients[json.to_id]);
                    request('https://apis.map.qq.com/ws/weather/v1/',function(error,response,body){
                        if(error){
                            console.log('请求报错：'+error);
                            ws.send('{"type":"system","code":"fail","content":"'+error+'"}');
                        }else{
                            console.log('请求成功：'+body);
                            let weather=JSON.parse(body);
                            let content='有人给我发了消息：'+json.content+'，我请求了接口，返回了:'+body;
                            clients[json.to_id].send('{"type":"message","code":"success","content":'+JSON.stringify(content)+'}');
                            ws.send('{"type":"system","code":"success","content":"发送成功"}');
                        }
                    });
                }else{
                    console.log('对方离线：'+clients[json.to_id]);
                    ws.send('{"type":"system","code":"fail","content":"发送失败"}');
                } 
            }
        }
    });
});