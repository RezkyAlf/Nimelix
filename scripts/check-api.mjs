try{process.loadEnvFile('.env.local')}catch{}
const base=process.env.ANIME_API_BASE_URL;
if(!base){console.error('ANIME_API_BASE_URL belum diatur');process.exit(1)}
try{const response=await fetch(`${base.replace(/\/$/,'')}/ongoing/1`,{signal:AbortSignal.timeout(15000)});const json=await response.json();if(!response.ok||!Array.isArray(json.data?.ongoingAnimeData))throw Error(`Respons API tidak sesuai (${response.status})`);console.log(`otakudesu-be terhubung: ${json.data.ongoingAnimeData.length} anime pada halaman pertama.`)}catch(error){console.error(error.message);process.exitCode=1}
