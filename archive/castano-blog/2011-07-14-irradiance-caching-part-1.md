# Irradiance Caching – Part 1

- **作者**：Ignacio Castaño
- **日期**：2011-07-14（更新于 2022-08-23）
- **原文**：https://www.ludicon.com/castano/blog/2011/07/irradiance-caching-part-1/
- **来源**：ludicon.com/castano/blog（WordPress REST API 全文）

---

I finally finished writing the [next article about the lightmap rendering tech](http://the-witness.net/news/2011/07/irradiance-caching-part-1/) that I did for The Witness. This one is about irradiance caching, and in particular I describe how to estimate irradiance gradients when the irradiance is sampled using a hemicube distribution. I’m afraid the article is a bit too specialized and I suspect it will only be useful to those that are trying to solve this particular problem, but I think it’s good to have this documented anyway.

This time around we are trying something new and we are cross-posting it on [#AltDevBlogADay](http://altdevblogaday.com/2011/07/14/irradiance-caching-part-1/). It seems to me that most of the subscribers to The Witness blog are non-programmers, so this way it may reach a wider audience. Hopefully this will also encourage me to post more regularly!
