# An Updated Sponza glTF

- **作者**：Ignacio Castaño
- **日期**：2026-02-09（更新于 2026-05-04）
- **原文**：https://www.ludicon.com/castano/blog/2026/02/an-updated-sponza-gltf/
- **来源**：ludicon.com/castano/blog（WordPress REST API 全文）

---

The other day I was looking at [this clustered shading WebGPU demo](https://toji.github.io/webgpu-clustered-shading) and was surprised by the jarring texture compression artifacts:

![](https://www.ludicon.com/castano/blog/wp-content/uploads/2026/02/ktx-700x472.png)

The glTF model using KTX ETC1S textures is very compact, but is it worth the dramatic quality reduction?

I wanted to see how this model would look with AVIF and *[Spark](https://ludicon.com/spark/)*, so I went looking for a version of the Sponza model with uncompressed textures that I could use as a baseline for a fair comparison.

The glTF used in the clustered shading demo appears to be based on the [Sponza model in Khronos’ sample model repository](https://github.com/KhronosGroup/glTF-Sample-Models/blob/main/2.0/Sponza/README.md), but neither of these includes uncompressed textures, only JPG and KTX files. [Morgan McGuire’s asset repository](https://casual-effects.com/data/) contains a version of the Sponza model in OBJ format with PNG textures, but it does not include normal maps or other PBR textures. The version published by [Alexandre Pestana](http://www.alexandre-pestana.com/pbr-textures-sponza/) is no longer available online, and downloading the [original Crytek assets (created by Frank Meinl)](https://www.cryengine.com/asset-db/product/crytek/sponza-sample-scene) requires registration and the use of a Windows-only downloader.

After some digging, I found that Hans-Kristian Arntzen had published [a version with uncompressed PNG textures](https://themaister.net/sponza-gltf-pbr/). However, I ran into issues loading the geometry in some glTF viewers, and the PNG files contained unnecessary alpha channels that inflated the total size and did not follow the glTF PBR texture guidelines.

To make the uncompressed version of the model more accessible, I cleaned up the PNGs, replaced the textures in Khronos’ glTF Sponza model with the updated assets, and uploaded the result to the following repository:

[https://github.com/ludicon/sponza-gltf](https://github.com/ludicon/sponza-gltf)

The next step was to compress this glTF model using AVIF and compare the resulting size and visual quality.

For this task I had previously experimented with a few ad-hoc scripts built on top of Don McCurdy’s [glTF Transform](https://gltf-transform.dev/) library. To make this workflow easier to reuse and share, I consolidated them into a small command-line tool called `gltf-tex`:

[https://github.com/ludicon/gltf-tex](https://github.com/ludicon/gltf-tex)

You can install it in your system with:

```
git clone https://github.com/ludicon/gltf-tex.git
cd gltf-tex
npm install
npm link
```

And run it as follows:

```
gltf-tex avif sponza-png.glb sponza-avif.glb --quality 80 --speed 4
```

While the glTF Transform command line tool already provides a command to convert textures to AVIF, it treats all images the same way regardless of how they are used. I wanted more control, in particular the ability to specify custom color spaces and linear transfer functions for texture assets that do not represent color images.

This was difficult to achieve with glTF Transform because it relies on the [sharp](https://sharp.pixelplumbing.com/) library for image processing. That limits the compression options that can be configured and does not necessarily use the latest versions of the underlying encoders with all the necessary features. In contrast, `gltf-tex` employs the system-provided `avifenc` tool directly.

Alternatively you may use the `sharp` library as well, but that may result in larger or lower quality textures:

```
gltf-tex avif sponza-png.glb sponza-avif.glb --sharp
```

To speed up asset processing, I run multiple instances of the AVIF encoder in parallel. While the encoder itself is multi-threaded, it rarely saturates all available cores, and some stages are I/O-bound. Running up to four instances in parallel improves overall throughput on my system. This can be configured with the `--concurrency N` command-line option.

While processing the Sponza model, I also noticed that some of its textures were identical, so I added another tool to eliminate the duplicate images adjusting the corresponding texture references. You can simply run it as follows:

```
gltf-tex dedup sponza-png.glb sponza-png-dedup.glb
```

With these tools in place I produced two additional versions of the Sponza model with AVIF textures at two different quality levels (one using `--quality 80` and the other using `--quality 50`).

`gltf-tex` also provides the `size` command to inspect and summarize the texture sizes. It displays not only the size on disk, but also the size in video memory with and without run-time compression.

```
gltf-tex size sponza-avif.glb
```

The resulting file sizes are as follows:

Model

Texture Size on Disk

Size in Video Memory

Sponza PNG

103.3 MB

256 MB (uncompressed)

Sponza AVIF (high quality)

17.6 MB

85.3 MB / 58.3 MB

Sponza AVIF (low quality)

6.5 MB

85.3 MB / 58.3 MB

Sponza KTX (ETC1S)

8.2 MB

44.7 MB

Sponza KTX (UASTC)

56.7 MB

85.3 MB

Note, the video memory size when using AVIF depends on whether you target 16 or 8 bit per block formats. *Spark* allows you to target both, but always chooses 8 bit formats for occlusion maps and 16 bit formats for normal maps, which is why the video memory size is slightly larger than when using ETC1S.

To see how the quality actually holds up I modified Tojiro’s demo to load and display the new assets. This only required a few minor changes:

- Adding support for EXT_texture_AVIF in the glTF loader.

- Unpacking tangent space normals in the shader (see my [previous post](https://www.ludicon.com/castano/blog/2026/02/normal-map-compression-revisited/) for more details on this).

- Loading textures using spark.js instead of the WebGPUTextureLoader.

The resulting code is available in Ludicon’s fork of the demo:

[https://github.com/Ludicon/webgpu-clustered-shading](https://github.com/Ludicon/webgpu-clustered-shading)

And here are some screenshots of the results:

      PNG

      AVIF HQ + Spark

      AVIF LQ + Spark

      KTX ETC1S

![Texture compression comparison](http://www.ludicon.com/castano/blog/wp-content/uploads/2026/02/png-no-spark.png)

103 MB

Even at the low quality level the results are extremely close to the original. The takeaway for me is that AVIF plus runtime GPU compression offers a much better quality-to-size tradeoff than precompressed KTX, while keeping download sizes much smaller.

### Addendum

I was asked about load time performance, so I run some quick tests locally to get a rough idea of what to expect.

All measurements were taken on a MacBook Pro M4. My Wi-Fi connection measures around 200 Mbps. The browser cache was disabled to approximate a first-time load. All timings are reported in milliseconds.

Browser

KTX ETC1S

KTX UASTC

AVIF LO

AVIF HI

Chrome

185+102 = 287

418+230 = 648

182+130 = 314

238+177 = 415

Firefox

180+939 = 1,119

423+3,246 = 3,669

204+430 = 664

254+460 = 714

Safari

184+208 = 392

424+235 = 659

174+722 = 896

235+755 = 990

Each entry shows two timings and their sum. The first number corresponds to downloading and parsing the glTF file; the second measures texture decoding and upload or transcoding. In an ideal implementation, these phases would overlap, you want to start processing textures as soon as the necessary data becomes available. The simple mini-gltf loader used here does not currently do that.

Measuring performance in the browser is inherently tricky. Execution is highly asynchronous, and it is possible that some of these timings include unrelated work.

KTX loading performance in Chrome and Safari is fairly similar, while Firefox performs significantly worse. AVIF loading performance varies substantially across browsers. Chrome uses all available CPU threads for image decoding, whereas Firefox decodes images in a single thread. Safari seems to use multiple threads as well, but it’s even slower despite of that.

Note, these are all CPU timings. Spark runs in the GPU and runs in fractions of a millisecond, so it doesn’t affect performance in a significant way. The CPU timings above are practically the same regardless of whether Spark is enabled or disabled.
