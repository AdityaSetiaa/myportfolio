import sharp from "sharp";

// Artwork supplied in public/mario_frames. Order matches header-mario.css.
const frames = [
  "mario_frame_08_r2_c3.png", // neutral
  "mario_frame_09_r2_c4.png", // step
  "mario_frame_10_r2_c5.png", // stride
  "mario_frame_19_r4_c4.png", // run
  "mario_frame_20_r4_c5.png", // run
  "mario_frame_12_r3_c2.png", // jump
  "mario_frame_07_r2_c2.png", // turn
  "mario_frame_24_r5_c4.png", // raised hand
  "mario_frame_25_r5_c5.png", // celebration
  "mario_frame_23_r5_c3.png", // inspect
];
const cell = { width: 120, height: 106 };

const layers = await Promise.all(frames.map(async (name, index) => {
  const { data, info } = await sharp(`public/mario_frames/${name}`).ensureAlpha().raw()
    .toBuffer({ resolveWithObject: true });
  let left = info.width, right = 0, top = info.height, bottom = 0;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const offset = (y * info.width + x) * 4;
      const [r, g, b] = data.subarray(offset, offset + 3);
      // The light and gray squares are part of the source pixels.
      if (Math.max(r, g, b) - Math.min(r, g, b) < 48) {
        data[offset + 3] = 0;
        continue;
      }
      left = Math.min(left, x);
      right = Math.max(right, x);
      top = Math.min(top, y);
      bottom = Math.max(bottom, y);
    }
  }
  const width = right - left + 1, height = bottom - top + 1;
  if (width < 1 || height < 1 || width > cell.width || height > cell.height) {
    throw new Error(`Unexpected foreground bounds for ${name}`);
  }
  return {
    input: await sharp(data, { raw: info }).extract({ left, top, width, height }).png().toBuffer(),
    left: index * cell.width + Math.floor((cell.width - width) / 2),
    top: cell.height - height,
  };
}));

await sharp({
  create: { width: cell.width * frames.length, height: cell.height, channels: 4, background: "#0000" },
}).composite(layers).png({ palette: true }).toFile("public/mario-motion.png");
