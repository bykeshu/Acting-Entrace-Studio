// Render the original SVG; no downloaded poster images are involved.
const path=require('node:path');
const sharp=require(process.env.ACTING_SHARP_PATH||'sharp');
const root=path.resolve(__dirname,'..');
(async()=>{
  for(const size of [192,512])await sharp(path.join(root,'icons','cinema-studio.svg')).resize(size,size).png().toFile(path.join(root,'icons',`cinema-studio-${size}.png`));
})().catch(error=>{console.error(error);process.exitCode=1;});
