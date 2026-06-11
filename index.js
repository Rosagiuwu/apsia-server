const express = require('express');
const fetch = require('node-fetch');
app = express();

app.use(express.json({limit:'50mb'}));
app.use((req,res,next)=>{
  res.header('Access-Control-Allow-Origin','*');
  res.header('Access-Control-Allow-Headers','Content-Type');
  res.header('Access-Control-Allow-Methods','POST,OPTIONS');
  if(req.method==='OPTIONS') return res.sendStatus(200);
  next();
});

app.post('/generate', async (req,res)=>{
  try{
    const {prompt} = req.body;
    const response = await fetch('https://api.replicate.com/v1/models/meta/musicgen/predictions',{
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'Authorization':'Bearer r8_HI0oJWXoojPkqkNhSrLI9AQkXDcAIRz22K7zB',
        'Prefer':'wait'
      },
      body:JSON.stringify({input:{prompt,model_version:'stereo-large',output_format:'mp3',duration:30}})
    });
    const data = await response.json();
    let audioUrl = data.output;
    if(Array.isArray(audioUrl)) audioUrl = audioUrl[0];

    // Descargar el audio y devolverlo directamente
    const audioResponse = await fetch(audioUrl);
    const audioBuffer = await audioResponse.buffer();
    res.set('Content-Type','audio/mpeg');
    res.send(audioBuffer);
  }catch(e){
    res.status(500).json({error:e.message});
  }
});

app.listen(process.env.PORT||3000,()=>console.log('APSIA server running'));
