# Announcing spark.js 0.1

- **作者**：Ignacio Castaño
- **日期**：2026-03-05
- **原文**：https://www.ludicon.com/castano/blog/2026/03/announcing-spark-js-0-1/
- **来源**：ludicon.com/castano/blog（WordPress REST API 全文）

---

I’m excited to announce [spark.js](https://github.com/Ludicon/spark.js) 0.1, now with WebGL support!

[spark.js](https://github.com/Ludicon/spark.js) has been evolving since I released it last summer. Since then, the WebGPU ecosystem has matured considerably. WebGPU is now more stable and widely supported across browsers and platforms. However, users kept telling me the same thing: even though targeting WebGPU is practical today, most teams have codebases that still rely on WebGL, and that made adoption difficult. For that reason I committed to adding WebGL support.

This felt like the right moment to bump the version number to 0.1 and signal that [spark.js](https://ludicon.com/sparkjs/) is production ready, not just experimental. That said, I expect the API to continue evolving based on the features developers need and the friction points they encounter.

### WebGL Support

Support for WebGL is the main feature of this update. For a long time I believed WebGL could not update the contents of a block compressed texture from the GPU. I thought it lacked support for Pixel Buffer Objects and didn’t support `EXT_copy_image` either, making it impossible to implement Spark without a CPU read-back. Turns out [I was wrong](https://github.com/KhronosGroup/WebGL/issues/3744), PBO support is there!

I’m not entirely sure where that misconception came from. I was possibly confused because PBO support in WebGL is somewhat limited compared to OpenGL. That may have been reinforced by Unity’s documentation, which reports that WebGL does [not have texture copy support](https://docs.unity3d.com/6000.0/Documentation/ScriptReference/Rendering.CopyTextureSupport.html), making me think that these limitations imposed a more severe constraint. However, in practice, WebGL provides everything needed to implement copies from UINT textures to block-compressed textures.

That said, these copies are more expensive compared to WebGPU and native APIs like Vulkan and D3D12. In WebGPU the shader can output to a buffer and then copy its contents to the compressed texture, and in some native APIs the shader can write to the compressed texture directly. The process in WebGL is far more convoluted. Compute shaders with buffer stores and raw image copies aren’t supported, so the codec has to run as a fragment program and output compressed blocks to a render target, then copy the render target to a pixel buffer object, and the PBO to the final compressed texture. Even with this overhead, real-time compression remains practical and fast enough for most applications.

### Cached Temporary Resources

Another issue I wanted to address is the driver overhead when compressing many textures. In my initial implementation I created temporary resources for each texture and destroyed them afterward. To reduce this overhead I added support for caching of the temporary resources. This is particularly critical in WebGL where you need to have both, temporary buffers and render targets.

In order to use the feature you have to opt-in when creating the spark object, and you can free the resources explicitly when done:

```
// Create spark object with temp resource caching enabled.
const spark = await Spark.create(device, { cacheTempResources: true })

// Load and transcode a bunch of textures at once.
const textures = await Promise.all(
  imageUrls.map(url => spark.encodeTexture(url))
)

// Free cached resources.
spark.freeTempResources()
```

### Other Features

Another way to reduce overhead is to allocate the output texture once and reuse it across updates. This is useful for textures whose contents change frequently, and can be achieved by passing the output texture as an option:

```
persistentTexture = spark.encodeTexture(renderTarget, 
    { outputTexture: persistentTexture }
)
```

In the future I’d like to extend this option to support other use cases, for example, encoding regions of a larger texture, which would be helpful to support virtual texturing applications.

The mipmapping improvements I discussed in [my previous post](https://www.ludicon.com/castano/blog/2026/02/runtime-mipmap-generation/) have now been merged. One unexpected issue I encountered is that alpha-weighting and the magic kernel did not play well together. The negative lobes of the kernel would sometimes produce zero or near zero alpha values. These would then cause fireflies when un-pre-multiplying. For now I’m using the alpha-weighted box kernel for textures with alpha. In the future, the right solution is probably to apply the sharpening filter after undoing the alpha pre-multiplication. If you’ve tackled this problem before, I’d love to hear how you approached it.

Finally, I’ve also started publishing the examples automatically with a github workflow, so you can explore them without having to checkout the repository or install the required development tools:

[https://ludicon.github.io/spark.js](https://ludicon.github.io/spark.js)

### WebGL Demo

With WebGL support in place, I’ve updated the [gltf-demo](https://ludicon.com/sparkjs/gltf-demo/) to support it. WebGL is used automatically when WebGPU is not supported, but you can also choose it explicitly using the `?renderer=webgl` URL argument:

[https://ludicon.com/sparkjs/gltf-demo/?renderer=webgl](https://ludicon.com/sparkjs/gltf-demo/?renderer=webgl)

### Integration with 3D Tiles Renderer

To really showcase this release, I wanted to take an existing WebGL application and add real-time texture compression, and I thought there was no better stress test than the [3D Tiles Renderer](https://github.com/NASA-AMMOS/3DTilesRendererJS).

Integrating [spark.js](https://github.com/Ludicon/spark.js) turned out to be extremely straightforward. The `TilesRenderer` uses three.js’s `GLTFLoader`, and spark already provides a plugin that handles image transcoding automatically, so the initial integration required just a couple of lines of code.

There was one gotcha: `TilesRenderer` tracks memory used by loaded tiles to decide when to stream in new tiles or unload existing ones, and it does this by assuming textures have an associated image bitmap. That assumption breaks when transcoding textures with Spark, since the resulting textures are `ExternalTexture` objects. To handle this, the Spark GLTF Plugin now stores the byte length in the texture’s `userData` field:

```
const texture = new THREE.ExternalTexture(textureObject.texture)
texture.format = textureObject.format
texture.userData.byteLength = textureObject.byteLength
```

And the memory footprint calculation handles this special case:

```
if ( tex instanceof ExternalTexture && tex.userData?.byteLength ) {
  return tex.userData.byteLength;
}
```

The results speak for themselves. Texture compression doesn’t just reduce bandwidth and power consumption, it frees up memory for higher-resolution textures with mipmaps (improving aliasing) and increased geometric detail. As they say, a picture is worth a thousand words:

        Spark OFF

        Spark ON

![TileRenderer with and wihtout Spark](https://www.ludicon.com/castano/blog/wp-content/uploads/2026/03/rome-spark-off.jpg)

Spark OFF

        Spark OFF

        Spark ON

![TileRenderer with and wihtout Spark](https://www.ludicon.com/castano/blog/wp-content/uploads/2026/03/sevilla-spark-off.jpg)

Spark OFF

You can check out the full code changes in our fork of the 3DTilesRendererJS repository:
[https://github.com/NASA-AMMOS/3DTilesRendererJS/pull/1497](https://github.com/NASA-AMMOS/3DTilesRendererJS/pull/1497)

### See You at GDC

Finally, if you would like to see [spark.js](https://github.com/Ludicon/spark.js) in person or chat about texture compression, I’ll be at GDC next week and I will be presenting at the 3D on the Web Khronos event:

[https://www.khronos.org/events/3d-on-the-web-2026](https://www.khronos.org/events/3d-on-the-web-2026)

Hope to see you there!
