# three.js + spark.js

- **作者**：Ignacio Castaño
- **日期**：2025-09-08（更新于 2025-09-24）
- **原文**：https://www.ludicon.com/castano/blog/2025/09/three-js-spark-js/
- **来源**：ludicon.com/castano/blog（WordPress REST API 全文）

---

[three.js r180](https://github.com/mrdoob/three.js/releases/tag/r180) was released last week and among the many improvements, the one that I’m most excited about is a series of changes by [Don McCurdy](https://www.donmccurdy.com/) that enable the use textures encoded with [spark.js](https://ludicon.com/sparkjs/) in [three.js](https://threejs.org/):

- Support ExternalTexture with GPUTexture [#31653](https://github.com/mrdoob/three.js/pull/31653)

- ExternalTexture: Support copy(), clone(). [#31731](https://github.com/mrdoob/three.js/pull/31731)

Support for `ExternalTexture` objects in the WebGPU backend allows you to wrap a `GPUTexture` object, such as the one produced by `Spark.encodeTexture` and use it directly in three.js. This makes it straightforward to work with Spark-encoded textures.

Here’s a brief example:

```
// Load and encode texture using spark:
const gpuTexture = await spark.encodeTexture(textureUrl, { srgb: true, flipY: true });

// Wrap the GPUTexture for three.js
const externalTex = new THREE.ExternalTexture(gpuTexture);

// Use as any other texture:
const material = new THREE.MeshBasicMaterial({ map: externalTex });
```

With this feature in place, I began testing spark.js in more complex scenarios. The first thing I wanted was a GLTF viewer example. With some help from Don McCurdy I was able to get something running quickly, and after after a bit of polish, I’m very happy with the results. It requires very minimal changes to existing code.

To simplify integration, the spark.js node package includes an addon that you import explicitly:

```
import { Spark } from "@ludicon/spark.js";
import { registerSparkLoader } from "@ludicon/spark.js/three-gltf";
```

Then use the imported function to register Spark with an existing `GLTFLoader` instance:

```
const loader = new GLTFLoader()
registerSparkLoader(loader, spark)
```

And that’s it! After registration, the loader will automatically encode textures with Spark whenever applicable.

![](https://www.ludicon.com/castano/blog/wp-content/uploads/2025/09/Screenshot-2025-09-08-at-11.05.07 PM-700x724.png)

This exercise was very useful in identifying some issues in the initial spark.js implementation, as well as some limitations in three.js.

### Concurrent Image Decoding

The initial performance results of the Spark texture loader were not surprising. I expected it to be a bit slower than the default loader, since Spark needs to dispatch its codecs to the GPU, and the first measurements seemed to confirm this.

After profiling, however, I discovered the reason why the Spark texture loader was slower: the input textures were being decoded sequentially in the main thread instead of being offloaded to a separate thread.

Fixing this was surprisingly simple. To get the image data I was using a [DOM Image object](https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement) and the solution was to simply set the [decoding](https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/decoding) attribute to `"async"`:

```
img.decoding = "async"
```

While digging into this, I also learned that the recommended approach is to use the [createImageBitmap](https://developer.mozilla.org/en-US/docs/Web/API/Window/createImageBitmap) API. Both approaches worked well, but the latter appeared to be slightly faster in practice, while producing the same results. The only difference I found is that the `Image` object supported rendering of SVG files while the `createImageBitmap` function did not, so to maintain feature parity I use `Image` objects for SVG files, and `createImageBitmap` for other image types.

With these changes I was pleased to see that the performance of the Spark texture loader was as good as the regular texture loader and in some cases even faster! Texture encoding happens asynchronously in the GPU which is usually idle during load time, so the extra work doesn’t add a noticeable overhead to the main thread.

Both three.js and spark.js need to generate mipmaps for these textures. Spark does this using compute shaders immediately after decoding, while three.js uses fragment shaders and does so at a later stage when the scene is evaluated. These differences may explain why Spark sometimes has a performance advantage, though I’m not familiar enough with the three.js internals to say for certain.

**Edit:**[Arseny points out](https://mastodon.gamedev.place/@zeux/115175339410444742) that image decoding appears to be sequential in Firefox and I’ve confirmed that’s indeed the case with both approaches described above. The only information I could find on the matter is a [14 year old bug report titled “Multithreaded image decoding”](https://bugzilla.mozilla.org/show_bug.cgi?id=716140) which appears to indicate the feature was implemented long ago, so I’m not sure what’s going on. If anyone can shed some light I would appreciate it!

### RG Normal Map Support

Another surprise was that three.js did not support normal maps stored in two-channel textures. This is a very common practice, most engines use two-channel compressed textures for normals, but in three.js the material shaders expect RGB values representing the packed XYZ coordinate.

In practice, it’s more efficient to store only the XY coordinates and reconstruct the Z by projecting it onto the hemisphere:

```
normal.z = sqrt(saturate(1.0 - dot(normal.xy, normal.xy)));
```

The XY normal map coordinates are usually not correlated, so block compression using a single plane doesn’t work very well. Early implementations used DXT5 textures using the Alpha block and the Green channel of the color block to encode the X and Y coordinates independently. Jan Paul van Waveren and I analyzed this scheme in our [Real-Time Normal Map DXT Compression](https://developer.download.nvidia.com/whitepapers/2008/real-time-normal-map-dxt-compression.pdf) paper back in 2008.

Today, we have specialized two-channel compression formats that are ideal to encode normal maps: BC5 on PC and EAC11_RG on mobile. Even with more general formats like BC7 and ASTC it’s also beneficial to use two-channel encodings. For example, the [Arm ASTC Encoder guidelines](https://developer.arm.com/documentation/102162/0430/About-Arm-ASTC-Encoder#md282-about-arm-astc-encoder__compressing-normal-maps) recommend packing normals as XXXY in order to use the Luminance-Alpha endpoint mode.

To support these packing schemes I’ve submitted a [PR to three.js](https://github.com/mrdoob/three.js/pull/31695), which is currently being reviewed, and I hope will land in the upcoming r181 release.

This feature benefits all three.js developers working with compressed textures, but to improve the quality of existing assets with offline-compressed textures it’s necessary to recompress them. In contrast, spark.js will leverage this feature as soon as it becomes available, automatically improving the quality of existing normal maps without any additional work.

### Performance Results

Measuring performance on web applications is tricky. Execution is very asynchronous, so when timing a piece of code it’s hard to be sure of what you are timing exactly. You could be timing extraneous tasks that happen to be scheduled in between your timing measurements, and code that you think you are measuring may actually be evaluated at a later point.

The chrome profiler has proven very useful to understand unexpected timing results. I wish the GPU timeline displayed the GPU debug group annotations, but in my tests the GPU usage is so sparse that it’s easy to infer what’s executing on it.

To keep things simple I decided to load a single GLTF file and measure the [FCP](https://web.dev/articles/fcp) (first contentful paint), that is, the time to the first rendered frame. Although in this particular test the first frame is not rendered until *all* the contents have finished loading. To estimate how much of that time can be attributed to the GLTF loading, I also measured the FCP of the same scene without the GLTF file and subtract that. Results are somewhat noisy specially on mobile, so I run them at least 3 times and pick the best. I also let the devices cool down in between tests to prevent throttling.

I’ve tested a bunch of different models, but the numbers here correspond to the [SciFiHelmet GLTF example](https://github.com/KhronosGroup/glTF-Sample-Models/tree/main/2.0/SciFiHelmet) from the Khronos [GLTF Sample Models](https://github.com/KhronosGroup/glTF-Sample-Models/tree/main). The original textures are PNGs and to produce the other variants I’ve used `[gltf-transform](https://gltf-transform.dev/)` with the default texture compression settings agglomerating the results in a single GLB file.

SciFiHelmet contains a single material with 4 2048×2048 textures for albedo, normal, roughness-metalness (RM), and occlusion. When using Spark these are encoded using a 16 byte per block format available for the albedo, normal and RM maps, and an 8 byte per block format for the occlussion. Format selection is done automatically based on the channel usage and available formats on the device. It is be possible to target lower quality (8 byte per block) formats, but I’m not doing that in this test.

I gathered these results on a MacBook Pro M4:

SciFiHelmet

Time (ms)

Texture Size (MB)

VRAM (MB)

PNG

121

26.64

85.33

PNG+Spark

101

26.64

18.66

WebP

68

1.44

85.33

WebP+Spark

55

1.44

18.66

AVIF

60

0.92

85.33

AVIF+Spark

53

0.92

18.66

Basis UASTC

170

12.96

22.36

Basis ETC1S

113

1.91

11.2

As noted before, on this machine the Spark texture loader appears to be faster than the default texture loader.

I also run this test in some mobile devices:

![](https://www.ludicon.com/castano/blog/wp-content/uploads/2025/09/sparkjs-mobile-700x525.jpg)

With the following results (all timings in milliseconds):

SciFiHelmet

Galaxy S23

Pixel 8

Pixel 7

AVIF

673

690

688

AVIF+Spark

736

653

811

Basis UASTC

1607

2920

crash!

Basis ETC1S

1120

1120

1077

I was curious to see how the Spark texture loaders compared to the KTX loader using textures encoded with Basis. Basis uses an intermediate representation that can be transcoded into any GPU texture format, but the transcoding runs on the CPU. While it’s much simpler than a full encoder, it appears to add a very significant overhead. Another issue is that Basis textures don’t compress nearly as well and the cost of loading these from disk is much higher that I anticipated.

Here’s the cost of the Basis transcoder on some devices using 4 worker threads with nearly 100% utilization:

MacBook Pro M4

Galaxy S23

Pixel 8

Basis UASTC

123 ms

358 ms

325 ms

Basis ETC1S

83 ms

170 ms

175 ms

### Other Performance Observations

It’s fairly common to use a single GLB file that embeds geometry and textures in a single file. While this is convenient for distribution and it may be appealing to reduce the number of connections, there’s one major disadvantage: A GLB file needs to be downloaded completely before transcoding can start.

I think it may be beneficial to use GLTF/GLB files that reference external texture assets. Loading these require additional connections and an indirection that may add latency, but as soon as the first image file is received we can start processing it in concurrently with the remaining downloads. Maybe this will the subject of an upcoming benchmark.

Compression ratios make a huge difference when downloading the files over the network, but I did not expect the loading times to make as big of a difference in my tests, because I’m running them locally and the assets are always cached on disk by the browser. I thought the reduced asset sizes would mainly have a secondary effect. With higher compression ratios, you can hold more assets in a fixed size cache, making cache hits more likely.

However, the impact of asset sizes is much more direct. Disk loading times on mobile appear to be much longer than I expected, or perhaps the browser is adding some other overheads I’m not aware of.

Here are the disk loading times for two different GLB files on different devices:

GLTF Size

MacBook Pro M4

Galaxy S23

Pixel 8

SciFiHelmet-avif.glb

4.4 MB

26.5 ms

191 ms

192 ms

SciFiHelmet-uastc.glb

16 MB

41 ms

795 ms

629 ms

### Feedback and Acknowledgments

If you’d like to try this out, the [spark.js GitHub repository](https://github.com/ludicon/spark.js) now includes two three.js examples. They should be easy to run, and I’d really appreciate your feedback.

Getting this up and running so quickly wouldn’t have been possible without the work from Don McCurdy, the patience from my college friend Tulo, and the incredible work of all the volunteers advancing web frameworks and standards. In recognition of this, I’ll be donating 10% of the [spark.js](https://ludicon.com/sparkjs/) sales to developers working on adjacent projects that push 3D graphics forward on the Web.
