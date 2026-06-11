const express = require('express');
const fetch = require('node-fetch');
const app = express();

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

    // Crear predicción
    const createRes = await fetch('https://api.replicate.com/v1/models/meta/musicgen/predictions',{
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'Authorization':'Bearer r8_HI0oJWXoojPkqkNhSrLI9AQkXDcAIRz22K7zB'
      },
      body:JSON.stringify({input:{prompt,model_version:'stereo-large',output_format:'mp3',duration:30}})
    });
    const prediction = await createRes.json();
    const pollUrl = prediction.urls.get;

    // Polling hasta que termine
    let audioUrl = null;
    for(let i=0;i<60;i++){
      await new Promise(r=>setTimeout(r,3000));
      const pollRes = await fetch(pollUrl,{
        headers:{'Authorization':'Bearer r8_HI0oJWXoojPkqkNhSrLI9AQkXDcAIRz22K7zB'}
      });
      const pollData = await pollRes.json();
      if(pollData.status==='succeeded'){
        audioUrl = Array.isArray(pollData.output)?pollData.output[0]:pollData.output;
        break;
      }
      if(pollData.status==='failed') throw new Error('Replicate failed');
    }

    if(!audioUrl) throw new Error('Timeout');

    // Descargar y devolver el audio
    const audioResponse = await fetch(audioUrl);
    const audioBuffer = await audioResponse.buffer();
    res.set('Content-Type','audio/mpeg');
    res.send(audioBuffer);

  }catch(e){
    console.error(e);
    res.status(500).json({error:e.message});
  }
});

app.listen(process.env.PORT||3000,()=>console.log('APSIA server running'));
