# Matt’s Gregory ACC Tessellation Render

- **作者**：Ignacio Castaño
- **日期**：2010-10-18（更新于 2019-01-16）
- **原文**：https://www.ludicon.com/castano/blog/2010/10/matts-gregory-acc-tessellation-render/
- **来源**：ludicon.com/castano/blog（WordPress REST API 全文）

---

A while ago Matt Davidson contacted me to discuss a few issues with the [Gregory ACC source code that we released](http://code.google.com/p/nvidia-mesh-tools/). Turns out there were some issues in the code that determines whether two patches have the same neighbor configuration and therefore can share the stencils. The code that compares the configurations is not very robust and sometimes reports that two patches have the same configuration, while in practice they do not. In retrospect, it would have been a better idea to simply compute the stencils independently and merge them afterwards.

In any case, he managed to work around the problem and posted a video showing the results:

I’m glad that despite the bugs somebody is actually making use of that code and finding it useful! Cool work Matt!
