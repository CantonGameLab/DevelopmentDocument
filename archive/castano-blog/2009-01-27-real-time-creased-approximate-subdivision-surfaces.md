# Real-Time Creased Approximate Subdivision Surfaces

- **作者**：Ignacio Castaño
- **日期**：2009-01-27（更新于 2019-01-17）
- **原文**：https://www.ludicon.com/castano/blog/2009/01/real-time-creased-approximate-subdivision-surfaces/
- **来源**：ludicon.com/castano/blog（WordPress REST API 全文）

---

Denis finally put his [I3D paper online](http://linserv1.cims.nyu.edu:17351/cgi-bin/moin.cgi/RealTimeCreasedACC)!

[![](http://linserv1.cims.nyu.edu:17351/cgi-bin/moin.cgi/RealTimeCreasedACC?action=AttachFile&do=get&target=heavy.png)](http://linserv1.cims.nyu.edu:17351/cgi-bin/moin.cgi/RealTimeCreasedACC)

Denis was my intern a couple of summers ago. We worked together on the implementation of the an emulation framework to implement and prototype various tessellation algorithms. Last summer he wanted to try something different, I recommended him to join a game studio, and he finally went to work at Valve.

Having spent so much time and effort working on approximate subdivision surfaces and talking about them to developers, it’s very pleasing to see these techniques being adopted in real applications.

Adding support for subdivision surfaces in a game engine requires significant changes in the production pipeline. Not only tools need to be updated, but production processes need to change, and artists need to be educated to adopt and learn the new tools.

I think this paper will be very valuable in that regard. It describes Valve’s experience integrating ACC into the Source engine. How the ACC scheme had to be extended to support creases in order to achieve the visuals that they were trying to achieve, the many problems that arose, and more importantly, the problems that could not be solved and that required artist intervention.
