# NVIDIA Texture Tools 2.0.6

- **作者**：Ignacio Castaño
- **日期**：2009-03-20（更新于 2019-01-17）
- **原文**：https://www.ludicon.com/castano/blog/2009/03/nvidia-texture-tools-2-0-6/
- **来源**：ludicon.com/castano/blog（WordPress REST API 全文）

---

Yesterday I released another revision of the stable branch of the NVIDIA Texture Tools. I recommend everybody to upgrade, since it fixes some bugs and artifacts, and improves compatibility with current and future CUDA drivers. Starting with this release I’m planning to provide a verbose description of the changes in each release. So, here it goes:

In a multi-GPU environment NVTT will now use the fastest GPU available. This is quite useful on systems that have an embedded and a discrete GPU. You certainly don’t want to use the embedded one while the discrete GPU is idle.

Using recent CUDA runtimes with older CUDA drivers usually causes problems. To avoid that, NVTT now determines the version of the available CUDA driver and makes sure it’s compatible with the CUDA runtime that was used to compile it.

The NVTT shutdown code did not destroy the CUDA context properly, which caused problems the second time you tried to create a context in the same thread. The behavior on 2.0 drivers was to reuse the context already created, but CUDA 2.1 produces an error instead. This is fixed now.

Note however, that you are not allowed to create multiple compressors in the same thread simultaneously. This is a limitation in the CUDA runtime API that transparently creates a CUDA context per thread. In the future I’m planning to use the driver API directly, which should remove this restriction.

There have been issues reported with the CUDA compressor not producing correct output when processing 1×1 mipmaps. I was able to reproduce the problem on old drivers, but it seems to be fixed now. In any case, I realized that using the entire GPU to compress a 1×1 mipmap did not make any sense, so now I’m compressing small mipmaps in the CPU instead. That is slightly faster and avoids the aforementioned problem.

Per request of the Wolfire guys, NVTT now scales images with alpha by weighting the color channels by the alpha component. While a simple workaround to obtain the right results was to use premultiplied alpha, there was no reason not to do the right thing in all cases.

As mentioned in my previous post, I’ve updated the single color compression tables to take into account the possible hardware decoding errors.

There was also a bug in the decompression of some RGB DDS files that is now fixed.

Progress on the 2.1 release is slow, but steady. The target features are almost complete, but I’ve been cleaning things up, removing a lot of cruft, and simplifying the code, in order to make it more accessible and encourage more contributions. I’m also working in a lower level API that should be more flexible and easier to maintain. More on that in a future post.
