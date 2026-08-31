import { Config } from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setPixelFormat('yuv420p');
Config.setCodec('h264');
Config.setCrf(16);
Config.setOverwriteOutput(true);

/**
 * O comercial e inteiramente WebGL + DOM. Em Linux headless sem GPU dedicada,
 * `swangle` (SwiftShader via ANGLE) e o unico renderer que entrega WebGL2
 * estavel — `angle` puro cai para software sem extensoes e quebra o postprocessing.
 */
Config.setChromiumOpenGlRenderer('swangle');
Config.setDelayRenderTimeoutInMilliseconds(120000);

/**
 * O ambiente de execucao bloqueia o download do Chrome Headless Shell do
 * Remotion, mas ja traz um Chromium instalado. `REMOTION_BROWSER_EXECUTABLE`
 * permite reaproveita-lo; em maquinas sem essa variavel o Remotion volta ao
 * comportamento padrao de baixar o proprio binario.
 */
if (process.env.REMOTION_BROWSER_EXECUTABLE) {
  Config.setBrowserExecutable(process.env.REMOTION_BROWSER_EXECUTABLE);
}
