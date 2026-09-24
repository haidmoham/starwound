# V1 demo capture

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
