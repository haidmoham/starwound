# Demo captures

## Tidal installation

The finished 10-second, 1080 × 1350, silent H.264 cut is at `~/Desktop/demos/starwound-tidal-v1.mp4`. It records the live `starwound.mhaider.dev` installation: the framed entrance, a move into the full field, and the eject study. It uses the browser's Canvas 2D fallback because WebGL was unavailable in the capture browser.

Recreate the take with `agent-browser` at an 800 × 1000 viewport. Start recording, wait about one second, click **enter**, wait about two seconds, click **03 eject**, then leave the field moving for six seconds. Resolve fresh element refs with `agent-browser snapshot -i` before clicking.

```sh
npx agent-browser open https://starwound.mhaider.dev/
npx agent-browser set viewport 800 1000
npx agent-browser snapshot -i
npx agent-browser record start /tmp/starwound-tidal-take.webm --fps 30
npx agent-browser wait 1200
npx agent-browser click @ENTER_REF
npx agent-browser wait 2200
npx agent-browser click @EJECT_REF
npx agent-browser wait 6500
npx agent-browser record stop
ffmpeg -y -i /tmp/starwound-tidal-take.webm -t 10 -vf 'fps=30,scale=1080:1350:flags=lanczos,format=yuv420p' -c:v libx264 -crf 20 -preset medium -movflags +faststart -an ~/Desktop/demos/starwound-tidal-v1.mp4
```

The take is silent by design; it does not record or imply playback from the optional YouTube companion.

## Original prototype

The finished 10-second, 1080 × 1350, silent H.264 video is stored outside Git at `~/Desktop/demos/starwound-v1.mp4`.

Capture the actual local instrument after `npm run dev -- --host 127.0.0.1`:

```sh
npx agent-browser open http://127.0.0.1:5173/
npx agent-browser set viewport 800 1000
npx agent-browser record start /tmp/starwound-take.webm --fps 15
npx agent-browser wait 10500
npx agent-browser record stop
ffmpeg -y -i /tmp/starwound-take.webm -t 10 -vf 'fps=30,scale=1080:1350:flags=lanczos,format=yuv420p' -c:v libx264 -crf 20 -preset medium -movflags +faststart -an ~/Desktop/demos/starwound-v1.mp4
```

The capture used the browser's Canvas 2D fallback because its WebGL context was unavailable. It depicts the synthetic preview; no commercial recording or audio track is included.
